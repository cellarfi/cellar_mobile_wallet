export interface CreateDonationEntry {
  id: string  
  post_id: string
  amount: number
  token_symbol?: string
  transaction_id?: string
  wallet_address: string
  message?: string
  donor_user_id?: string
  created_at: Date
}
