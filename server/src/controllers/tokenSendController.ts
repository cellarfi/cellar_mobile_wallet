import { PointsService } from '@/service/pointsService';
import { TokenSendDto, tokenSendDtoSchema } from '@/utils/dto/tokens.dto';
import { Request, Response } from 'express';

/**
 * Records a token send transaction and awards points to the user
 * The actual token send functionality happens client-side
 * This endpoint just records the completed transaction and awards points
 */
export const recordTokenSend = async (
  req: Request<{}, {}, TokenSendDto>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const user_id = user.id;

    // Validate the request payload
    const { success, data, error } = await tokenSendDtoSchema.safeParseAsync(
      req.body
    );

    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    // Award points for sending tokens
    try {
      const pointsResult = await PointsService.awardPoints(
        user_id,
        'TOKEN_SEND',
        {
          transaction_signature: data.transaction_signature,
          token_address: data.token_address,
          amount: data.amount,
          recipient_address: data.recipient_address,
          token_name: data.token_name,
          token_symbol: data.token_symbol,
          value_usd: data.value_usd,
          timestamp: new Date().toISOString(),
        }
      );

      // Return success response with the points awarded
      res.status(200).json({
        success: true,
        data: {
          points_awarded: pointsResult?.point?.amount || 0,
          current_balance: pointsResult?.userPoint?.balance || null,
          transaction_recorded: true,
        },
      });
    } catch (pointsError) {
      console.error('[recordTokenSend] Error awarding points:', pointsError);

      // Even if points awarding fails, return a success response for the transaction recording
      res.status(200).json({
        success: true,
        data: {
          points_awarded: 0,
          transaction_recorded: true,
          error: 'Failed to award points, but transaction was recorded',
        },
      });
    }
  } catch (err: any) {
    console.error('[recordTokenSend] Error:', err);
    res.status(500).json({
      success: false,
      error: 'An error occurred recording the token send',
    });
  }
};
