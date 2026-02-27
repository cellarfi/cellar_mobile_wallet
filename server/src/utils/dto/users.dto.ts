import { z } from 'zod'

export const createUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  display_name: z.string().min(1).max(50),
  tag_name: z.string().min(3).max(20),
  profile_picture_url: z.string().url().optional(),
  about: z.string().optional(),
  referred_by: z.string().optional(),
  created_at: z.string().datetime(),
})
export type CreateUserDto = z.infer<typeof createUserSchema>

export const createUserWalletSchema = z.object({
  user_id: z.string(),
  chain_type: z.string(),
  address: z.string(),
  is_default: z.boolean().optional(),
})
export type CreateUserWalletDto = z.infer<typeof createUserWalletSchema>

export const updateUserDefaultWalletSchema = z.object({
  user_id: z.string(),
  wallet_id: z.string(),
})
export type UpdateUserDefaultWalletDto = z.infer<
  typeof updateUserDefaultWalletSchema
>

export const updateUserSchema = z
  .object({
    display_name: z.string().min(1).max(50).optional(),
    tag_name: z.string().min(3).max(20).optional(),
    profile_picture_url: z.string().url().optional(),
    about: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        !data.display_name &&
        !data.tag_name &&
        !data.profile_picture_url &&
        !data.about
      ) {
        return false
      }
      return true
    },
    {
      message: 'At least one field must be provided for update',
    }
  )
export type UpdateUserDto = z.infer<typeof updateUserSchema>
