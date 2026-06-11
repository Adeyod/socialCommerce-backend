import { Injectable } from '@nestjs/common';
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

  async creditWalletPendingBalance(
    owner: WalletOwner,
    amount: number,
    referenceId: string,
    category: LedgerCategory,
    metadata?: Record<string, any>,
    session?: ClientSession,
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
      metadata,
    }).save({ session });

    const newWalletBalance = await this.walletModel.updateOne(
      query,
      { $inc: { yetToBeClearedBalance: amount } },
      { upsert: true, session },
    );

    console.log('newWalletBalance:', newWalletBalance);

    return newWalletBalance;
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
