import { z } from 'zod'
import { fromHex } from '../libs/chains.helper'

export const solSignMessageParamsSchema = z.tuple([
  z.string().min(1).transform(fromHex),
  z.literal('utf8'),
])

export const solSignTransactionsParamsSchema = z
  .array(z.tuple([z.string().min(1).transform(fromHex), z.boolean()]))
  .min(1)
