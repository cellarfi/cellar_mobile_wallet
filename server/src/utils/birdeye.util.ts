import { BirdEyeTimePeriod } from '@/types'
import { Env } from './constants/Env'

export const birdEyeHeader = {
  accept: 'application/json',
  'x-chain': 'solana',
  'X-API-KEY': Env.BIRDEYE_API_KEY,
}

export function getBirdeyeTimeParams(timeframe: BirdEyeTimePeriod) {
  const now = Math.floor(Date.now() / 1000)
  let type: BirdEyeTimePeriod = '15m'
  let time_from = now - 60 * 60 // Default to 1H

  switch (timeframe) {
    case '1H':
      type = '15m'
      time_from = now - 60 * 60 * 24
      break
    case '1D':
      type = '15m'
      time_from = now - 24 * 7 * 60 * 60
      break
    case '1W':
      type = '4H'
      time_from = now - 7 * 4 * 60 * 60 * 24
      break
    case '1M':
      type = '1D'
      time_from = now - 30 * 24 * 60 * 60
      break
    case '1Y':
      type = '1Y'
      time_from = now - 365 * 24 * 60 * 60
      break
    default:
      type = '15m'
      time_from = now - 60 * 60
      break
    // case 'YTD':
    //   type = '1D'
    //   const startOfYear = Math.floor(
    //     new Date(new Date().getFullYear(), 0, 1).getTime() / 1000
    //   )
    //   time_from = startOfYear
    //   break
    // case 'ALL':
    //   type = '1D'
    //   time_from = now - 365 * 24 * 60 * 60 // 1 year of data
    //   break
  }
  return { type, time_from, time_to: now }
}
