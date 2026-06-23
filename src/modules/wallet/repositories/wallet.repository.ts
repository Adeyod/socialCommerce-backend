import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  Ledger,
  LedgerCategory,
  LedgerDocument,
  LedgerType,
} from '../schemas/ledger.schema';
import {
  Wallet,
  WalletDocument,
  WalletOwnerType,
} from '../schemas/wallet.schema';
import { WalletOwner } from '../types/wallet-owner.types';

@Injectable()
export class WalletRepository {
  constructor(
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,

    @InjectModel(Ledger.name)
    private readonly ledgerModel: Model<LedgerDocument>,
  ) {}

  // async creditWalletPendingBalance(
  // owner: WalletOwner,
  // amount: number,
  // referenceId: string,
  // category: LedgerCategory,
  // metadata?: Record<string, any>,
  // session?: ClientSession,
  // ): Promise<{
  //   ledger: LedgerDocument;
  //   wallet: any;
  // }> {
  //   const query =
  //     owner.ownerType === WalletOwnerType.user
  //       ? { userId: new Types.ObjectId(owner.userId) }
  //       : owner.ownerType === WalletOwnerType.business
  //         ? { businessId: new Types.ObjectId(owner.businessId) }
  //         : { ownerType: WalletOwnerType.platform };

  //   const ledgerData: any = {
  //     ownerType: owner.ownerType,
  //     type: LedgerType.credit,
  //     amount,
  //     referenceId,
  //     category,
  //     metadata,
  //   };

  // if (owner.ownerType === WalletOwnerType.user) {
  //   ledgerData.userId = new Types.ObjectId(owner.userId);
  // }

  // if (owner.ownerType === WalletOwnerType.business) {
  //   ledgerData.businessId = new Types.ObjectId(owner.businessId);
  // }

  //   const setOnInsert: any = {
  //     ownerType: owner.ownerType,
  //   };

  //   if (owner.ownerType === WalletOwnerType.user) {
  //     setOnInsert.userId = new Types.ObjectId(owner.userId);
  //   }

  //   if (owner.ownerType === WalletOwnerType.business) {
  //     setOnInsert.businessId = new Types.ObjectId(owner.businessId);
  //   }

  //   const ledgerCreation = await new this.ledgerModel(ledgerData).save({
  //     session,
  //   });

  //   console.log('ledgerCreation:', ledgerCreation);

  //   let walletUpdate: any;

  //   try {
  //     walletUpdate = await this.walletModel.updateOne(
  //       query,
  //       {
  //         $setOnInsert: setOnInsert,
  //         $inc: { yetToBeClearedBalance: amount },
  //       },
  //       { upsert: true, session },
  //     );
  //     console.log('walletUpdate 1:', walletUpdate);
  //   } catch (err: any) {
  //     if (err.code === 11000) {
  //       walletUpdate = await this.walletModel.updateOne(
  //         query,
  //         { $inc: { yetToBeClearedBalance: amount } },
  //         { session },
  //       );
  //       console.log('walletUpdate 2:', walletUpdate);
  //     } else {
  //       console.log('err:', err);
  //       throw err;
  //     }
  //   }

  //   console.log('walletUpdate final:', walletUpdate);
  //   return {
  //     ledger: ledgerCreation,
  //     wallet: walletUpdate,
  //   };
  // }

  async creditWalletPendingBalance(
    owner: WalletOwner,
    amount: number,
    referenceId: string,
    category: LedgerCategory,
    metadata?: Record<string, any>,
    session?: ClientSession,
  ) {
    const ledgerData: any = {
      ownerType: owner.ownerType,
      type: LedgerType.credit,
      amount,
      referenceId,
      category,
      metadata,
    };

    if (owner.ownerType === WalletOwnerType.user) {
      ledgerData.userId = new Types.ObjectId(owner.userId);
    }

    if (owner.ownerType === WalletOwnerType.business) {
      ledgerData.businessId = new Types.ObjectId(owner.businessId);
    }

    const ledgerEntry = await new this.ledgerModel(ledgerData).save({
      session,
    });

    console.log('ledgerEntry:', ledgerEntry);

    let walletUpdate: any;

    // PLATFORM (MUST EXIST)
    if (owner.ownerType === WalletOwnerType.platform) {
      walletUpdate = await this.walletModel.updateOne(
        { ownerType: WalletOwnerType.platform },
        { $inc: { yetToBeClearedBalance: amount } },
        { session },
      );

      if (walletUpdate.matchedCount === 0) {
        throw new Error(
          'CRITICAL: Platform wallet missing. It must be created at app startup.',
        );
      }
    }

    // BUSINESS (MUST EXIST)
    else if (owner.ownerType === WalletOwnerType.business) {
      walletUpdate = await this.walletModel.updateOne(
        {
          ownerType: WalletOwnerType.business,
          businessId: new Types.ObjectId(owner.businessId),
        },
        { $inc: { yetToBeClearedBalance: amount } },
        { session },
      );

      if (walletUpdate.matchedCount === 0) {
        throw new Error(
          `Business wallet not found for businessId: ${owner.businessId}`,
        );
      }
    }

    // USER (OPTIONAL UPSERT)
    else if (owner.ownerType === WalletOwnerType.user) {
      walletUpdate = await this.walletModel.updateOne(
        {
          ownerType: WalletOwnerType.user,
          userId: new Types.ObjectId(owner.userId),
        },
        {
          $setOnInsert: {
            ownerType: WalletOwnerType.user,
            userId: owner.userId,
            withdrawableBalance: 0,
          },
          $inc: {
            yetToBeClearedBalance: amount,
          },
        },
        {
          upsert: true,
          session,
        },
      );
    } else {
      throw new Error('Invalid wallet owner type');
    }

    console.log('walletUpdate:', walletUpdate);

    return {
      ledger: ledgerEntry,
      walletUpdate,
    };

    // let walletUpdate: any;

    // // PLATFORM WALLET (MUST EXIST)
    // if (owner.ownerType === WalletOwnerType.platform) {
    //   walletUpdate = await this.walletModel.updateOne(
    //     { ownerType: WalletOwnerType.platform },
    //     { $inc: { yetToBeClearedBalance: amount } },
    //     { session },
    //   );

    //   if (walletUpdate.matchedCount === 0) {
    //     throw new Error(
    //       'CRITICAL: Platform wallet does not exist. Ensure it is created at app startup.',
    //     );
    //   }
    // }

    // // 🏢 BUSINESS WALLET (MUST EXIST)
    // else if (owner.ownerType === WalletOwnerType.business) {
    //   walletUpdate = await this.walletModel.updateOne(
    //     {
    //       ownerType: WalletOwnerType.business,
    //       businessId: owner.businessId,
    //     },
    //     { $inc: { yetToBeClearedBalance: amount } },
    //     { session },
    //   );

    //   if (walletUpdate.matchedCount === 0) {
    //     throw new Error(
    //       `Business wallet not found for businessId: ${owner.businessId?.toString()}`,
    //     );
    //   }
    // }

    // // USER WALLET (OPTIONAL: still allow lazy creation)
    // else if (owner.ownerType === WalletOwnerType.user) {
    //   walletUpdate = await this.walletModel.updateOne(
    //     {
    //       ownerType: WalletOwnerType.user,
    //       userId: owner.userId,
    //     },
    //     {
    //       $setOnInsert: {
    //         ownerType: WalletOwnerType.user,
    //         userId: owner.userId,
    //         withdrawableBalance: 0,
    //       },
    //       $inc: {
    //         yetToBeClearedBalance: amount,
    //       },
    //     },
    //     {
    //       upsert: true,
    //       session,
    //     },
    //   );
    // } else {
    //   throw new Error('Invalid wallet owner type');
    // }

    // return walletUpdate;
  }
  async creditWalletWithdrawableBalance(
    owner: WalletOwner,
    amount: number,
    referenceId: string,
    category: LedgerCategory,
  ) {
    const query =
      owner.ownerType === WalletOwnerType.user
        ? { userId: new Types.ObjectId(owner.userId) }
        : owner.ownerType === WalletOwnerType.business
          ? { businessId: new Types.ObjectId(owner.businessId) }
          : { ownerType: WalletOwnerType.platform };

    const newLedger = await new this.ledgerModel({
      ...owner,
      type: LedgerType.credit,
      amount,
      referenceId,
      category,
    }).save();

    const newWalletBalance = await this.walletModel.updateOne(
      query,
      { $inc: { withdrawableBalance: amount } },
      { upsert: true },
    );

    console.log('newWalletBalance:', newWalletBalance);

    return newWalletBalance;
  }

  async debitWallet(
    owner: WalletOwner,
    amount: number,
    referenceId: string,
    category: LedgerCategory,
  ) {
    const query =
      owner.ownerType === WalletOwnerType.user
        ? { userId: new Types.ObjectId(owner.userId) }
        : owner.ownerType === WalletOwnerType.business
          ? { businessId: new Types.ObjectId(owner.businessId) }
          : { ownerType: WalletOwnerType.platform };

    const newLedger = await new this.ledgerModel({
      ...owner,
      type: LedgerType.debit,
      amount,
      referenceId,
      category,
    }).save();

    const newWalletBalance = await this.walletModel.updateOne(query, {
      $inc: { withdrawableBalance: -amount },
    });

    console.log('newWalletBalance:', newWalletBalance);

    return newWalletBalance;
  }

  async getWallet(owner: WalletOwner): Promise<WalletDocument | null> {
    const query =
      owner.ownerType === WalletOwnerType.user
        ? { userId: new Types.ObjectId(owner.userId) }
        : owner.ownerType === WalletOwnerType.business
          ? { businessId: new Types.ObjectId(owner.businessId) }
          : { ownerType: WalletOwnerType.platform };

    const wallet = await this.walletModel.findOne(query);

    return wallet;
  }

  async createWallet(owner: WalletOwner): Promise<WalletDocument | null> {
    let query: any;
    let payload: any;

    // Determine wallet type
    if (owner.ownerType === WalletOwnerType.user) {
      if (!owner.userId) {
        throw new BadRequestException({
          message: 'userId is required to create user wallet',
          success: false,
          status: 400,
        });
      }

      query = {
        ownerType: WalletOwnerType.user,
        userId: new Types.ObjectId(owner.userId),
      };

      payload = {
        ownerType: WalletOwnerType.user,
        userId: new Types.ObjectId(owner.userId),
      };
    } else if (owner.ownerType === WalletOwnerType.business) {
      if (!owner.businessId) {
        throw new BadRequestException({
          message: 'businessId is required to create business wallet',
          success: false,
          status: 400,
        });
      }

      query = {
        ownerType: WalletOwnerType.business,
        businessId: new Types.ObjectId(owner.businessId),
      };

      payload = {
        ownerType: WalletOwnerType.business,
        businessId: new Types.ObjectId(owner.businessId),
      };
    } else {
      throw new BadRequestException({
        message: 'Invalid wallet owner type for createWallet',
        success: false,
        status: 400,
      });
    }

    // Check if wallet already exists
    const existingWallet = await this.walletModel.findOne(query);

    console.log('existingWallet:', existingWallet);

    if (existingWallet) {
      return existingWallet; // idempotent behavior
    }

    // Create wallet
    const createdWallet = await new this.walletModel({
      ...payload,
      withdrawableBalance: 0,
      yetToBeClearedBalance: 0,
    }).save();

    console.log('createdWallet:', createdWallet);

    return createdWallet;
  }

  async createOneTimePlatformWallet() {
    const wallet = await this.walletModel.updateOne(
      { ownerType: WalletOwnerType.platform },
      {
        $setOnInsert: {
          ownerType: WalletOwnerType.platform,
          withdrawableBalance: 0,
          yetToBeClearedBalance: 0,
        },
      },
      { upsert: true },
    );

    console.log('wallet:', wallet);
    return wallet;
  }

  /**
   * Run this ones to create wallet for the platform
   * await this.walletModel.updateOne(
  { ownerType: WalletOwnerType.platform },
  {
    $setOnInsert: {
      ownerType: WalletOwnerType.platform,
      withdrawableBalance: 0,
      yetToBeClearedBalance: 0,
    },
  },
  { upsert: true },
);
   */
}
