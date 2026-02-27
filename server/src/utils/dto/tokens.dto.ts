import { z } from 'zod';

// DTO for token send transaction recording
export const tokenSendDtoSchema = z.object({
  transaction_signature: z.string(),
  token_address: z.string(),
  amount: z.number().positive(),
  recipient_address: z.string(),
  token_name: z.string().optional(),
  token_symbol: z.string().optional(),
  value_usd: z.number().optional(),
});

export type TokenSendDto = z.infer<typeof tokenSendDtoSchema>;
