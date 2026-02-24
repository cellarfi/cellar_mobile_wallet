import { ENV } from '@/constants/Env'
import { getConnection, sendNativeSol } from '@/libs/solana.lib'
import { SendSplToken } from '@/libs/spl.helpers'
import { useEmbeddedSolanaWallet } from '@privy-io/expo'
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js'
import { useState } from 'react'

interface SendManualTransactionParams {
  token: string
  recipientAddress: string
  amount: number
  walletAddress: string
  isSOLToken: boolean
}

interface UseSendManualTransactionReturn {
  sendTransaction: (params: SendManualTransactionParams) => Promise<any>
  isLoading: boolean
  error: string | null
}

export const useSendManualTransaction = (): UseSendManualTransactionReturn => {
  const { wallets } = useEmbeddedSolanaWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendTransaction = async (params: SendManualTransactionParams): Promise<any> => {
    const { token, recipientAddress, amount, walletAddress, isSOLToken } = params

    setIsLoading(true)
    setError(null)

    try {
      // Get the wallet provider
      const provider = await wallets?.[0]?.getProvider()
      if (!provider) {
        throw new Error('No wallet provider available')
      }

      // Reusable transaction builder method
      const buildTransaction = async (
        token: string,
        recipientAddress: string,
        amount: number,
        walletAddress: string,
        isSOLToken: boolean
      ): Promise<Transaction> => {
        if (!walletAddress) {
          throw new Error('Wallet address is required')
        }
        if (!recipientAddress) {
          throw new Error('Recipient address is required')
        }
        if (!amount || amount <= 0) {
          throw new Error('Valid amount is required')
        }

        const fromPubkey = new PublicKey(walletAddress)
        const toPubkey = new PublicKey(recipientAddress)

        if (isSOLToken) {
          // Build SOL transaction
          console.log('Building SOL transaction')
          const lamports = Math.floor(amount * LAMPORTS_PER_SOL)

          console.log('lamports', {
            amount: lamports,
            fromPubkey,
            toPubkey,
          })
          return await sendNativeSol(new Connection(ENV.RPC_URL), {
            amount: lamports,
            fromPubkey,
            toPubkey,
          })
        } else {
          // Build SPL token transaction
          console.log('Building SPL token transaction')
          const mintAddress = new PublicKey(token)
          return await SendSplToken(getConnection(), {
            amount,
            fromPubKey: fromPubkey,
            toPubKey: toPubkey,
            mintAddress,
          })
        }
      }

      // Build the transaction
      const transaction = await buildTransaction(
        token,
        recipientAddress,
        amount,
        walletAddress,
        isSOLToken
      )

      // Send the transaction using Privy
      const result = await provider.request({
        method: 'signAndSendTransaction',
        params: {
          transaction,
          connection: getConnection(),
        },
      })

      console.log('result', result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    sendTransaction,
    isLoading,
    error,
  }
}