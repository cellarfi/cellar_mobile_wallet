export interface TokenHolder {
  address: string
  amount: number
  decimals: number
  insider: boolean
  owner: string
  pct: number
  uiAmount: number
  uiAmountString: string
}

interface LiquidityPool {
  base: number
  baseMint: string
  basePrice: number
  baseUSD: number
  currentSupply: number
  holders: TokenHolder[]
  lpCurrentSupply: number
  lpLocked: number
  lpLockedPct: number
  lpLockedUSD: number
  lpMaxSupply: number
  lpMint: string
  lpTotalSupply: number
  lpUnlocked: number
  pctReserve: number
  pctSupply: number
  quote: number
  quoteMint: string
  quotePrice: number
  quoteUSD: number
  reserveSupply: number
  tokenSupply: number
  totalTokensUnlocked: number
}

interface Market {
  liquidityA: string
  liquidityAAccount: string
  liquidityB: string
  liquidityBAccount: string
  lp: LiquidityPool
  marketType: string
  mintA: string
  mintAAccount: string
  mintB: string
  mintBAccount: string
  mintLP: string
  mintLPAccount: string
  pubkey: string
}

export interface Risk {
  description: string
  level: string
  name: string
  score: number
  value: string
}

interface VerificationLink {
  provider: string
  value: string
}

export interface RugResponse {
  creator: string
  creatorTokens: Array<{
    createdAt: string
    marketCap: number
    mint: string
  }>
  detectedAt: string
  events: Array<{
    createdAt: string
    event: number
    newValue: string
    oldValue: string
  }>
  fileMeta: {
    description: string
    image: string
    name: string
    symbol: string
  }
  freezeAuthority: string
  graphInsidersDetected: number
  insiderNetworks: Array<{
    activeAccounts: number
    id: string
    size: number
    tokenAmount: number
    type: string
  }>
  knownAccounts: Record<
    string,
    {
      name: string
      type: string
    }
  >
  lockerOwners: Record<string, boolean>
  lockers: Record<
    string,
    {
      owner: string
      programID: string
      tokenAccount: string
      type: string
      unlockDate: number
      uri: string
      usdcLocked: number
    }
  >
  markets: Market[]
  mint: string
  mintAuthority: string
  price: number
  risks: Risk[]
  rugged: boolean
  score: number
  score_normalised: number
  token: string
  tokenMeta: {
    mutable: boolean
    name: string
    symbol: string
    updateAuthority: string
    uri: string
  }
  tokenProgram: string
  tokenType: string
  token_extensions: string
  topHolders: TokenHolder[]
  totalHolders: number
  totalLPProviders: number
  totalMarketLiquidity: number
  transferFee: {
    authority: string
    maxAmount: number
    pct: number
  }
  verification: {
    description: string
    jup_strict: boolean
    jup_verified: boolean
    links: VerificationLink[]
    mint: string
    name: string
    payer: string
    symbol: string
  }
}
