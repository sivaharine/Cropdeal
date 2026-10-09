export interface Wallet {
  id?: string;
  userId: string;
  balance: number;
  currency: string;
  updatedAt?: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  orderId?: string;
  timestamp: string;
}
