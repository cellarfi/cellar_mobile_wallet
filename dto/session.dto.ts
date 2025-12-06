import { z } from 'zod'

// Client-side schema - user_id is NOT included because the server
// extracts it from the authenticated user's token
export const createSessionSchema = z.object({
  device_id: z.string(),
  push_token: z.string().max(500), // Push notification token (FCM/APNs)
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

// Client-side update schema - session_id is NOT included because
// it's passed as a URL parameter
export const updateSessionSchema = z
  .object({
    push_token: z.string().max(500).optional(), // Push notification token (FCM/APNs)
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
      return Object.values(data).some((value) => value !== undefined)
    },
    {
      message: 'At least one field must be provided for update',
    }
  )
export type UpdateSessionDto = z.infer<typeof updateSessionSchema>

// Client-side query schema - user_id is NOT included because
// it's extracted from the auth token on the server
export const sessionQuerySchema = z.object({
  device_id: z.string().optional(),
  status: z.enum(['ACTIVE', 'SIGNED_OUT', 'REVOKED']).optional(),
})
export type SessionQueryDto = z.infer<typeof sessionQuerySchema>
