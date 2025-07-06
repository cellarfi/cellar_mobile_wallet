export interface PrivyWalletAccount {
  type: 'wallet';
  address: string;
  verified_at: number;
  first_verified_at: number | null;
  latest_verified_at: number | null;
  chain_type: 'solana';
  wallet_client: 'unknown';
  wallet_client_type?: string | undefined;
  connector_type?: string | undefined;
}
