import { z } from 'zod'

export const createPost = z.object({
  content: z.string(),
  user_id: z.string(),
  media: z.string().array().optional(),
})

// DTO for updating a post
export const updatePost = z.object({
  id: z.string().min(1, 'Post ID is required'),
  content: z.string().min(1, 'Content cannot be empty'),
})

// Enhanced post creation for fundraising posts
export const createFundraisingPost = z.object({
  content: z.string(),
  user_id: z.string(),
  post_type: z.enum(['TOKEN_CALL', 'DONATION']),

  // Funding metadata fields
  target_amount: z.number().positive(),
  wallet_address: z.string(),
  chain_type: z.string(),
  token_symbol: z.string().optional(),
  token_address: z.string().optional(),
  deadline: z.string().datetime().optional(), // ISO date string
})

// DTO for creating funding metadata separately
export const createFundingMeta = z.object({
  post_id: z.string(),
  target_amount: z.number().positive(),
  wallet_address: z.string(),
  chain_type: z.string(),
  token_symbol: z.string().optional(),
  token_address: z.string().optional(),
  deadline: z.string().datetime().optional(),
})

// DTO for updating funding metadata
export const updateFundingMeta = z.object({
  post_id: z.string(),
  target_amount: z.number().positive().optional(),
  wallet_address: z.string().optional(),
  chain_type: z.string().optional(),
  token_symbol: z.string().optional(),
  token_address: z.string().optional(),
  deadline: z.string().datetime().optional(),
  current_amount: z.number().optional(),
})

export const addLike = z.object({
  post_id: z.string(),
  user_id: z.string(),
})

export const createCommentSchema = z.object({
  post_id: z.string(),
  text: z.string(),
  user_id: z.string(),
  parent_id: z.string().optional(),
  media: z.string().array().optional(),
})

export const deleteLike = z.object({
  id: z.string(),
  post_id: z.string(),
  user_id: z.string(),
})

export const deleteComment = z.object({
  id: z.string(),
  post_id: z.string(),
  user_id: z.string(),
})

export const tipUser = z.object({
  post_id: z.string(),
  amount: z.number(),
})

// Donation schema (unchanged)
export const createDonation = z.object({
  post_id: z.string(),
  amount: z.number().positive(),
  token_symbol: z.string().default('SOL'),
  transaction_id: z.string().optional(),
  wallet_address: z.string(),
  message: z.string().optional(),
  donor_user_id: z.string().optional(), // Optional if donor is registered user
})

// Update fundraising status (now updates funding_meta)
export const updateFundraisingStatus = z.object({
  post_id: z.string(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED']),
})

// Token Call DTOs - Simplified to match actual schema
export const createTokenCall = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  token_name: z.string().min(1, 'Token name is required'),
  token_symbol: z.string().min(1, 'Token symbol is required'),
  token_address: z.string().min(1, 'Token address is required'),
  chain_type: z.string().min(1, 'Chain type is required'),
  logo_url: z.string().url().optional(),
  launch_date: z.string().datetime().optional(),
  initial_price: z.number().positive().optional(),
  target_price: z.number().positive().optional(),
  market_cap: z.number().positive().optional(),
  description: z.string().optional(),
})

export const updateTokenCall = z.object({
  post_id: z.string(),
  token_name: z.string().min(1).optional(),
  token_symbol: z.string().min(1).optional(),
  token_address: z.string().min(1).optional(),
  chain_type: z.string().min(1).optional(),
  logo_url: z.string().url().optional(),
  launch_date: z.string().datetime().optional(),
  initial_price: z.number().positive().optional(),
  target_price: z.number().positive().optional(),
  market_cap: z.number().positive().optional(),
  description: z.string().optional(),
})

// Unified post creation schema that validates all post types
export const createUnifiedPost = z.discriminatedUnion('post_type', [
  // Regular post
  z.object({
    content: z.string().min(1, 'Content cannot be empty'),
    post_type: z.literal('REGULAR'),
    media: z.string().array().optional(),
  }),

  // Donation post
  z.object({
    content: z.string().min(1, 'Content cannot be empty'),
    post_type: z.literal('DONATION'),
    target_amount: z.number().positive('Target amount must be positive'),
    wallet_address: z.string().min(1, 'Wallet address is required'),
    chain_type: z.string().min(1, 'Chain type is required'),
    token_symbol: z.string().optional(),
    token_address: z.string().optional(),
    deadline: z.string().datetime().optional(),
    media: z.string().array().optional(),
  }),

  // Token call post
  z.object({
    content: z.string().min(1, 'Content cannot be empty'),
    post_type: z.literal('TOKEN_CALL'),
    token_name: z.string().min(1, 'Token name is required'),
    token_symbol: z.string().min(1, 'Token symbol is required'),
    token_address: z.string().min(1, 'Token address is required'),
    chain_type: z.string().min(1, 'Chain type is required'),
    logo_url: z.string().url().optional(),
    launch_date: z.string().datetime().optional(),
    initial_price: z.number().positive().optional(),
    target_price: z.number().positive().optional(),
    market_cap: z.number().positive().optional(),
    description: z.string().optional(),
    media: z.string().array().optional(),
  }),
])

// V2 DTOs for Tapestry-backed SocialFi (all IDs are Tapestry IDs, not local DB IDs)
export const followUserV2Schema = z.object({
  target_user_id: z.string().optional(),
  target_tag_name: z.string().optional(),
}).refine(
  (data) => data.target_user_id || data.target_tag_name,
  {
    message: 'Either target_user_id or target_tag_name is required',
    path: ['target_user_id'],
  },
)

export const createPostV2Schema = z.intersection(
  createUnifiedPost,
  z.object({
    // Allow clients to override execution behavior in the future if needed
    tapestry_execution_mode: z
      .enum(['FAST_UNCONFIRMED', 'QUICK_SIGNATURE', 'CONFIRMED_AND_PARSED'])
      .optional(),
  })
)

// For v2, `post_id` in createCommentV2Schema is treated as the Tapestry content ID
export const createCommentV2Schema = createCommentSchema.extend({
  tapestry_execution_mode: z
    .enum(['FAST_UNCONFIRMED', 'QUICK_SIGNATURE', 'CONFIRMED_AND_PARSED'])
    .optional(),
  // Optional key/value metadata for rich comments (e.g. attachments, custom fields)
  properties: z
    .array(
      z.object({
        key: z.string(),
        value: z.union([z.string(), z.number(), z.boolean()]),
      }),
    )
    .optional(),
})

// For v2, `post_id` is treated as the Tapestry content/node ID
export const likePostV2Schema = z.object({
  post_id: z.string(),
})

export const logTradeV2Schema = z.object({
  token_in_mint: z.string(),
  token_out_mint: z.string(),
  amount_in: z.string(),
  amount_out: z.string(),
  tx_signature: z.string(),
  usd_value_in: z.number().optional(),
  usd_value_out: z.number().optional(),
  wallet_address: z.string().optional(),
  input_value_sol: z.number().optional(),
  output_value_sol: z.number().optional(),
  sol_price: z.number().optional(),
  trade_type: z.enum(['buy', 'sell']).optional(),
  slippage: z.number().optional(),
  priority_fee: z.number().optional(),
  source: z.string().optional(),
  source_wallet: z.string().optional(),
  source_transaction_id: z.string().optional(),
})

export type CreatePostDto = z.infer<typeof createPost>
export type UpdatePostDto = z.infer<typeof updatePost>
export type CreateFundraisingPostDto = z.infer<typeof createFundraisingPost>
export type CreateFundingMetaDto = z.infer<typeof createFundingMeta>
export type UpdateFundingMetaDto = z.infer<typeof updateFundingMeta>
export type addLikeDto = z.infer<typeof addLike>
export type createCommentDto = z.infer<typeof createCommentSchema>
export type deleteLikeDto = z.infer<typeof deleteLike>
export type deleteCommentDto = z.infer<typeof deleteComment>
export type tipUserDto = z.infer<typeof tipUser>
export type CreateDonationDto = z.infer<typeof createDonation>
export type UpdateFundraisingStatusDto = z.infer<typeof updateFundraisingStatus>
export type CreateTokenCallDto = z.infer<typeof createTokenCall>
export type UpdateTokenCallDto = z.infer<typeof updateTokenCall>
export type CreateUnifiedPostDto = z.infer<typeof createUnifiedPost>
export type FollowUserV2Dto = z.infer<typeof followUserV2Schema>
export type CreatePostV2Dto = z.infer<typeof createPostV2Schema>
export type CreateCommentV2Dto = z.infer<typeof createCommentV2Schema>
export type LikePostV2Dto = z.infer<typeof likePostV2Schema>
export type LogTradeV2Dto = z.infer<typeof logTradeV2Schema>
