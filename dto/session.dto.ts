import { z } from 'zod'

export const createSessionSchema = z.object({
  user_id: z.string(),
  device_id: z.string(),
  expo_push_token: z.string().max(500),
  platform: z.enum(['ios', 'android', 'web', 'desktop']),
  device_name: z.string().optional(),
  os_version: z.string().optional(),
  app_version: z.string().optional(),
  device_model: z.string().optional(),
  agent: z.string().optional(),
  ip_address: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  status: z.enum(['ACTIVE', 'SIGNED_OUT', 'REVOKED']).default('ACTIVE'),
})
export type CreateSessionDto = z.infer<typeof createSessionSchema>

export const updateSessionSchema = z
  .object({
    session_id: z.string(),
    expo_push_token: z.string().max(500).optional(),
    platform: z.enum(['ios', 'android', 'web', 'desktop']).optional(),
    device_name: z.string().optional(),
    os_version: z.string().optional(),
    app_version: z.string().optional(),
    device_model: z.string().optional(),
    agent: z.string().optional(),
    ip_address: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    status: z.enum(['ACTIVE', 'SIGNED_OUT', 'REVOKED']).optional(),
  })
  .refine(
    (data) => {
      const { session_id, ...updateFields } = data
      return Object.values(updateFields).some((value) => value !== undefined)
    },
    {
      message: 'At least one field must be provided for update',
    }
  )
export type UpdateSessionDto = z.infer<typeof updateSessionSchema>

export const sessionQuerySchema = z.object({
  user_id: z.string(),
  device_id: z.string().optional(),
  status: z.enum(['ACTIVE', 'SIGNED_OUT', 'REVOKED']).optional(),
})
export type SessionQueryDto = z.infer<typeof sessionQuerySchema>
