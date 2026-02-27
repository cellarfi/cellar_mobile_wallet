import { z } from 'zod'

export const createTransactionDtoSchema = z.object({
  user_id: z.string(),
  amount: z.number().or(z.string()),
  token_address: z.string(),
  token_name: z.string(),
  type: z.enum(['TRANSFER', 'SWAP', 'DONATION']),
  tx_hash: z.string(),
})

export type CreateTransactionSchema = z.infer<
  typeof createTransactionDtoSchema
>