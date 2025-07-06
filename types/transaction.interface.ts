export type TransactionType = 'send' | 'receive' | 'swap' | 'buy' | 'sell';

export interface Transaction {
  id: string;
  type: TransactionType;
  symbol: string;
  amount: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  recipientAddress?: string;
  senderAddress?: string;
  fee?: number;
  logoURI?: string;
}

export interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}
