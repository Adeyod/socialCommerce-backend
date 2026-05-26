import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ledger, LedgerDocument, LedgerType } from '../schemas/ledger.schema';
import { Wallet, WalletDocument } from '../schemas/wallet.schema';

@Injectable()
export class WalletRepository {
  constructor(
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,

    @InjectModel(Ledger.name)
    private readonly ledgerModel: Model<LedgerDocument>,
  ) {}

  async creditWallet(
    userId: string,
    amount: number,
    referenceId: string,
    source: string,
  ) {
    const uid = new Types.ObjectId(userId);

    const newLedger = await new this.ledgerModel({
      userId: uid,
      type: LedgerType.credit,
      amount,
      referenceId,
      source,
    }).save();

    const newWalletBalance = await this.walletModel.updateOne(
      { userId: uid },
      { $inc: { balance: amount } },
      { upsert: true },
    );

    console.log('newWalletBalance:', newWalletBalance);

    return newWalletBalance;
  }

  async debitWallet(
    userId: string,
    amount: number,
    referenceId: string,
    source: string,
  ) {
    const uid = new Types.ObjectId(userId);

    const newLedger = await new this.ledgerModel({
      userId: uid,
      type: LedgerType.debit,
      amount,
      referenceId,
      source,
    }).save();

    const newWalletBalance = await this.walletModel.updateOne(
      { userId: uid },
      { $inc: { balance: -amount } },
    );

    console.log('newWalletBalance:', newWalletBalance);

    return newWalletBalance;
  }

  async getWallet(userId: string): Promise<WalletDocument | null> {
    const uid = new Types.ObjectId(userId);

    const wallet = await this.walletModel.findOne({
      userId: uid,
    });

    return wallet;
  }
}
