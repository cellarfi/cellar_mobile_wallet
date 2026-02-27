import { z } from 'zod'
import { Network, SUPPORTED_NETWORKS } from '../networks.util'
import { isValidSolanaAddress } from '../solana.util'

export const createAddressBookSchema = z.object({
  user_id: z.string(),
  name: z.string().min(1),
  address: z.string().refine(isValidSolanaAddress, {
    message: 'Invalid wallet address',
  }),
  description: z.string().optional(),
  network: z
    .string()
    .refine((value) => SUPPORTED_NETWORKS.includes(value as Network), {
      message: 'Invalid network',
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  is_favorite: z.boolean().optional(),
})
export type AddressBookDto = z.infer<typeof createAddressBookSchema>

export const updateAddressBookSchema = createAddressBookSchema
  .partial()
  .required({
    user_id: true,
  })
  .refine(
    (data) =>
      data.address ||
      data.name ||
      data.description ||
      data.tags ||
      data.is_favorite,
    {
      message: 'At least one field must be provided for update',
    }
  )
export type UpdateAddressBookDto = z.infer<typeof updateAddressBookSchema>
