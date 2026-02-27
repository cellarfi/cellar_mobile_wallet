import { AnalyticsModel } from '@/models/analytics.model'
import { createTransactionDtoSchema } from '@/utils/dto/analytics.dto'
import { Request, Response } from 'express'

export const createTransaction = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = req.user!.id
  if (!req.body) {
    res.status(400).json({
      success: false,
      error: "Request Body can't be empty",
    })
    return
  }
  const { success, data, error } =
    await createTransactionDtoSchema.safeParseAsync({
      ...req.body,
      user_id: id,
    })
  if (!success) {
    res.status(400).json({
      success: false,
      error: error.message,
    })
    return
  }
  const transaction = await AnalyticsModel.createTransaction(data)

  res.status(200).json({
    success: true,
    data: transaction,
  })
}
