export interface JupiterOrderRequest {
  inputMint: string
  outputMint: string
  amount: number
  taker: string
  referralAccount?: string
  referralFee?: number
}

interface SwapInfo {
  ammKey: string
  label: string
  inputMint: string
  outputMint: string
  inAmount: string
  outAmount: string
  feeAmount: string
  feeMint: string
}

interface RoutePlan {
  swapInfo: SwapInfo
  percent: number
}

interface DynamicSlippageReport {
  slippageBps: number
  otherAmount: null
  simulatedIncurredSlippageBps: null
  amplificationRatio: null
  categoryName: string
  heuristicMaxSlippageBps: number
  rtseSlippageBps: number
  failedTxnEstSlippage: number
  emaEstSlippage: number
  useIncurredSlippageForQuoting: null
}

export interface JupiterQuoteOrderResponse {
  swapType: string
  requestId: string
  inAmount: string
  outAmount: string
  otherAmountThreshold: string
  swapMode: string
  slippageBps: number
  priceImpactPct: string
  routePlan: RoutePlan[]
  inputMint: string
  outputMint: string
  feeBps: number
  taker: string
  gasless: boolean
  transaction: string
  prioritizationType: string
  prioritizationFeeLamports: number
  dynamicSlippageReport: DynamicSlippageReport
  totalTime: number
}

interface SwapEvent {
  inputMint: string
  inputAmount: string
  outputMint: string
  outputAmount: string
}

export interface JupiterExecuteOrderResponse {
  status: string
  signature: string
  slot: string
  code: number
  inputAmountResult: string
  outputAmountResult: string
  swapEvents: SwapEvent[]
}
