import { WalletOwnerType } from '../schemas/wallet.schema';

export type WalletOwner =
  | { ownerType: WalletOwnerType.user; userId: string }
  | { ownerType: WalletOwnerType.business; businessId: string }
  | {
      ownerType: WalletOwnerType.platform;
    };
