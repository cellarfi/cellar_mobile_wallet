import { birdEyeRequests } from '@/utils/api_requests/birdeye.request'
import { Request, Response } from 'express'

export const getWalletPortfolio = async (
  req: Request<
    { walletAddress: string },
    {},
    {},
    { includePriceChange: boolean }
  >,
  res: Response
): Promise<void> => {
  try {
    const { walletAddress } = req.params
    const { includePriceChange } = req.query

    const portfolioResponse = await birdEyeRequests.wallet.getWalletPortfolio(
      walletAddress
    )

    if (!portfolioResponse.success) {
      res.status(500).json({
        success: false,
        message: portfolioResponse.message,
      })
      return
    }

    const portfolio = portfolioResponse.data

    if (Boolean(includePriceChange)) {
      const priceDataResponse = await birdEyeRequests.defi.getMultiPrice(
        portfolio?.items.map((item) => item.address) || []
      )

      const portfolioWithPriceChange = portfolio?.items.map((item) => {
        const priceData = priceDataResponse.data?.[item.address]
        return {
          ...item,
          priceChange24h: priceData?.priceChange24h,
          liquidity: priceData?.liquidity,
        }
      })

      if (portfolio) {
        portfolio.items = portfolioWithPriceChange || portfolio.items || []
      }
    }

    // Return the result
    res.json(portfolio)
  } catch (err: any) {
    console.error('[tokenPortfolioHandler] Error:', err)
    res.status(500).json({
      success: false,
      error: err.message || 'An error occurred processing your swap request',
    })
  }
}

export const getWalletHistory = async (
  req: Request<{ walletAddress: string }>,
  res: Response
): Promise<void> => {
  try {
    const { walletAddress } = req.params

    const historyResponse =
      await birdEyeRequests.wallet.getWalletTransactionHistory(walletAddress)

    if (!historyResponse.success) {
      res.status(500).json({
        success: false,
        message: historyResponse.message,
      })
      return
    }

    // Return the result
    res.json(historyResponse.data)
  } catch (err: any) {
    console.error('[getWalletHistory] Error:', err)
    res.status(500).json({
      success: false,
      error: err.message || 'An error occurred processing your history request',
    })
  }
}
