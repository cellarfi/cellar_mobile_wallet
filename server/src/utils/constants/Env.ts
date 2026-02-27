import { config } from 'dotenv'

config()

export const Env = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL || '',
  BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY || '',
  COINGECKO_API_KEY: process.env.COINGECKO_API_KEY || '',
  RUGCHECKER_API_KEY: process.env.RUGCHECKER_API_KEY || '',
  HELIUS_API_KEY: process.env.HELIUS_API_KEY || '',
  RPC_URL: process.env.RPC_URL || '',
  PRIVY_APP_ID: process.env.PRIVY_APP_ID || '',
  PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  PAJ_API_KEY: process.env.PAJ_API_KEY || '',
  TAPESTRY_API_KEY: process.env.TAPESTRY_API_KEY || '',
}
