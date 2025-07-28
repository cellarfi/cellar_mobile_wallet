import { ENV } from './Env'

export const Keys = {
  PRIVY_IDENTITY_TOKEN: 'privy_identity_token',
}

// Number of days required between tag name updates
export const TAG_NAME_UPDATE_RATE_LIMIT = 7

export const blurHashPlaceholder =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj['

export const ENDPOINTS = {
  // Use the SERVER_URL from env
  serverBase: ENV.SERVER_URL,
  // Jupiter endpoints – these default values can be overridden by changing SERVER_URL if needed.
  jupiter: {
    quote: 'https://api.jup.ag/swap/v1/quote',
    swap: ENV.SERVER_URL + '/api/jupiter/swap',
  },
  // Raydium endpoints
  raydium: {
    swapApi: 'https://transaction-v1.raydium.io',
    v3Api: 'https://api-v3.raydium.io',
  },
  // Jito block engine endpoint.
  jito: {
    blockEngine: 'https://mainnet.block-engine.jito.wtf:443/api/v1/bundles',
  },
  // Helius RPC endpoint from env
  helius: `https://mainnet.helius-rpc.com/?api-key=${ENV.HELIUS_API_KEY}`,
  tensorFlowBaseUrl: 'https://api.mainnet.tensordev.io',
}

export const PUBLIC_KEYS = {
  wSolMint: 'So11111111111111111111111111111111111111112',
  // Default receiver public key for transfers
  defaultReceiver: '24MDwQXG2TWiST8ty1rjcrKgtaYaMiLdRxFQawYgZh4v',
  jitoTipAccounts: [
    '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
    'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
    'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
    'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
    'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
    'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
    'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
    '3AVi9Tg9Uo68tJfuvoKvqKNWKc5wPdSSdeBnizKZ6jT',
  ],
}

export enum SolanaRpcMethod {
  sol_connect = 'sol_connect',
  sol_disconnect = 'sol_disconnect',
  sol_signMessage = 'sol_signMessage',
  sol_signTransactions = 'sol_signTransactions',
  sol_signAndSendTransactions = 'sol_signAndSendTransactions',
}


// Mock data
export const portfolioData = {
  totalBalance: '12,847.32',
  dailyChange: '+247.58',
  dailyChangePercent: '+2.04%',
  tokens: [
    {
      symbol: 'SOL',
      name: 'Solana',
      balance: '45.2',
      value: '$8,294.40',
      change: '+5.2%',
      logo: '◉',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      balance: '2,847.32',
      value: '$2,847.32',
      change: '0.0%',
      logo: '●',
    },
    {
      symbol: 'RAY',
      name: 'Raydium',
      balance: '156.8',
      value: '$892.16',
      change: '+12.4%',
      logo: '⚡',
    },
    {
      symbol: 'BONK',
      name: 'Bonk',
      balance: '1,234,567',
      value: '$813.44',
      change: '-3.2%',
      logo: '🐕',
    },
  ],
}

export const trendingTokens = [
  {
    symbol: 'WIF',
    name: 'dogwifhat',
    price: '$2.84',
    change: '+23.5%',
    volume: '$45.2M',
    logo: '🐕',
  },
  {
    symbol: 'JUP',
    name: 'Jupiter',
    price: '$0.67',
    change: '+18.2%',
    volume: '$32.1M',
    logo: '🪐',
  },
  {
    symbol: 'PYTH',
    name: 'Pyth Network',
    price: '$0.42',
    change: '+15.8%',
    volume: '$28.7M',
    logo: '🔮',
  },
  {
    symbol: 'HNT',
    name: 'Helium',
    price: '$7.23',
    change: '+12.4%',
    volume: '$19.8M',
    logo: '📡',
  },
]

export const socialPosts = [
  {
    id: 1,
    user: '@cryptowhale',
    content: 'SOL looking bullish after breaking $200 resistance! 🚀',
    likes: 142,
    tips: 12,
    timeAgo: '2h',
  },
  {
    id: 2,
    user: '@defi_trader',
    content:
      'New liquidity mining opportunity on Raydium. APY looks interesting 👀',
    likes: 89,
    tips: 8,
    timeAgo: '4h',
  },
]

// Mock data
export const walletData = {
  mainWallet: {
    name: 'Main Wallet',
    address: '7xKXtg2C...9W8BeFhJ',
    totalValue: '$12,847.32',
    isActive: true,
  },
  otherWallets: [
    {
      name: 'Trading Wallet',
      address: '9mNcVp4K...2L5HwRsT',
      totalValue: '$3,245.67',
      isActive: false,
    },
    {
      name: 'DeFi Wallet',
      address: '5qRsTu8X...8P3YvBnM',
      totalValue: '$8,592.14',
      isActive: false,
    },
  ],
}

export const tokens = [
  {
    symbol: 'SOL',
    name: 'Solana',
    balance: '45.2',
    value: '$8,294.40',
    change: '+5.2%',
    price: '$183.45',
    logo: '◉',
    color: '#14F195',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    balance: '2,847.32',
    value: '$2,847.32',
    change: '0.0%',
    price: '$1.00',
    logo: '●',
    color: '#2775CA',
  },
  {
    symbol: 'RAY',
    name: 'Raydium',
    balance: '156.8',
    value: '$892.16',
    change: '+12.4%',
    price: '$5.69',
    logo: '⚡',
    color: '#C200FB',
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    balance: '1,234,567',
    value: '$813.44',
    change: '-3.2%',
    price: '$0.0000658',
    logo: '🐕',
    color: '#FF6B35',
  },
  {
    symbol: 'JUP',
    name: 'Jupiter',
    balance: '892.45',
    value: '$598.34',
    change: '+8.7%',
    price: '$0.67',
    logo: '🪐',
    color: '#FFA500',
  },
]