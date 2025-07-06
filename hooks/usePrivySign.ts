import { useEmbeddedSolanaWallet } from '@privy-io/expo'
import { type Transaction, type VersionedTransaction } from '@solana/web3.js'
import { useConnection } from '../contexts/ConnectionProvider'

type SolanaTransaction = Transaction | VersionedTransaction

export const usePrivySign = () => {
  const { wallets = [] } = useEmbeddedSolanaWallet()
  const { connection } = useConnection()
  const wallet = wallets[0]

  const signMessage = async (message: string) => {
    try {
      if (!wallet) throw new Error('No wallet connected')
      const provider = await wallet.getProvider()

      const { signature } = await provider.request({
        method: 'signMessage',
        params: {
          message,
        },
      })

      return signature
    } catch (error) {
      console.error('Error signing message:', error)
      throw error
    }
  }

  const signTransaction = async (transaction: SolanaTransaction) => {
    try {
      if (!wallet) throw new Error('No wallet connected')
      const provider = await wallet.getProvider()

      const { signedTransaction } = await provider.request({
        method: 'signTransaction',
        params: {
          transaction,
        },
      })

      return signedTransaction
    } catch (error) {
      console.error('Error signing transaction:', error)
      throw error
    }
  }

  const signAndSendTransaction = async (transaction: SolanaTransaction) => {
    try {
      if (!wallet) throw new Error('No wallet connected')
      const provider = await wallet.getProvider()

      const { signature } = await provider.request({
        method: 'signAndSendTransaction',
        params: {
          transaction,
          connection,
        },
      })

      return signature
    } catch (error) {
      console.error('Error signing and sending transaction:', error)
      throw error
    }
  }

  return {
    signMessage,
    signTransaction,
    signAndSendTransaction,
    isWalletConnected: !!wallet,
  }
}
