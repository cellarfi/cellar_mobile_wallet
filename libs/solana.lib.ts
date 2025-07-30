import { ENV } from '@/constants/Env'
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import bs58 from 'bs58'

export const NATIVE_SOL_ADDRESS = '11111111111111111111111111111111'
export const NATIVE_SOL_MINT = 'So11111111111111111111111111111111111111111'
export const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112'

export const getConnection = () => {
  return new Connection(ENV.RPC_URL, {
    commitment: 'confirmed',
  })
}

export const sendNativeSol = async (
  connection: Connection,
  {
    amount,
    fromPubkey,
    toPubkey,
  }: {
    amount: number
    fromPubkey: PublicKey
    toPubkey: PublicKey
  }
) => {
  try {
    // ensure the receiving account will be rent exempt
    const minimumBalance = await connection.getMinimumBalanceForRentExemption(
      0 // note: simple accounts that just store native SOL have `0` bytes of data
    )

    if (amount < minimumBalance) {
      throw new Error(`account may not be rent exempt: ${toPubkey.toBase58()}`)
      // return Response.json({
      //   error: `account may not be rent exempt: ${toPubkey.toBase58()}`,
      // })
    }

    // create an instruction to transfer native SOL from one wallet to another
    const transferSolInstruction = SystemProgram.transfer({
      fromPubkey: fromPubkey,
      toPubkey: toPubkey,
      lamports: amount,
    })

    // get the latest blockhash amd block height
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash()

    // create a legacy transaction
    const transaction = new Transaction({
      feePayer: fromPubkey,
      blockhash,
      lastValidBlockHeight,
    }).add(transferSolInstruction)

    // const transaction = new Transaction().add(
    //   SystemProgram.transfer({
    //     fromPubkey: fromPubkey,
    //     toPubkey: toPubkey,
    //     lamports: amount,
    //   })
    // )
    // transaction.feePayer = fromPubkey
    // transaction.recentBlockhash = (
    //   await connection.getLatestBlockhash()
    // ).blockhash
    // transaction.lastValidBlockHeight = (
    //   await connection.getLatestBlockhash()
    // ).lastValidBlockHeight

    return transaction
  } catch (error: any) {
    throw new Error(error.message || 'Unknown error occurred')
  }
}

export const calculateFee = async (
  connection: Connection,
  transaction: Transaction
) => {
  const fee = await connection.getFeeForMessage(
    transaction.compileMessage(),
    'confirmed'
  )
  return fee.value || 0
}

export const isMintAddress = (address: string) => {
  // Solana addresses are 32-44 characters long and contain only base58 characters
  const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

  return solanaAddressRegex.test(address)
}

export const isValidSolanaAddress = (address: string): boolean => {
  try {
    if (!address) return false

    const pubKey = new PublicKey(address)
    return PublicKey.isOnCurve(pubKey.toBytes())
  } catch {
    return false
  }
}

export const isValidBase58PrivateKey = (key: string): boolean => {
  try {
    const decoded = bs58.decode(key.trim())
    return decoded.length === 64 // Solana private key is 64 bytes
  } catch {
    return false
  }
}

export const SUPPORTED_NETWORKS = ['solana', 'soon', 'sonic'] as const

export type Network = (typeof SUPPORTED_NETWORKS)[number]

export function serializeInstruction(inst: TransactionInstruction) {
  return {
    keys: inst.keys.map((key) => {
      return {
        pubkey: key.pubkey.toString(),
        isSigner: key.isSigner,
        isWritable: key.isWritable,
      }
    }),
    programId: inst.programId.toString(),
    data: inst.data.toString('base64'),
  }
}
