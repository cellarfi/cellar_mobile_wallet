import { getRate, initializeSDK, offRampCreateOrder, RateType } from 'paj_ramp'

export const testPaj = async () => {
  console.log('Testing Paj')

  // Selects the environment you want to work with
  initializeSDK('production')
  // or production

  const rate = await getRate(RateType.offRamp)
  console.log('rate', rate)

  const createOrder = await offRampCreateOrder(
    'token',
    'bank_id',
    'account_number',
    'NGN' as any, // Currency
    10000, // amount
    'token_mint_address',
    'webhook_url'
  )
  console.log('createOrder', createOrder)
}
