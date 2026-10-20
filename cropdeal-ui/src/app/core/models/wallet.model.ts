export interface Wallet {
  id?: string;
  walletId?: number;
  userId: string;
  userRole?: string;
  balance: number;            // Total net funds
  totalBalance?: number;      // Equivalent to balance
  reservedBalance: number;    // Funds locked/reserved in active bids
  availableBalance: number;   // Unreserved funds available for new purchases / withdrawal
  currency: string;
  updatedAt?: string;
}

export interface WalletTransaction {
  id: string;
  walletId?: string;
  userId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT' | 'RESERVATION' | 'RELEASE' | 'PAYMENT' | 'REFUND';
  description: string;
  referenceId?: string;
  orderId?: string;
  timestamp: string;
  date?: string;
  time?: string;
  bankTransfer?: string;
  status?: string;
}
