import { getConnection } from '@/libs/solana.lib'
import { useEmbeddedSolanaWallet } from '@privy-io/expo'
import { Transaction, VersionedTransaction } from '@solana/web3.js'

type SolanaTransaction = Transaction | VersionedTransaction

export const usePrivySign = () => {
  const { wallets = [] } = useEmbeddedSolanaWallet()
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
      // let tx: Transaction
      // if (transaction instanceof VersionedTransaction) {
      //   tx = Transaction.from(transaction.serialize())
      // } else {
      //   tx = transaction
      // }

      // const { blockhash, lastValidBlockHeight } =
      //   await getConnection().getLatestBlockhash()
      // tx.recentBlockhash = blockhash
      // tx.lastValidBlockHeight = lastValidBlockHeight

      console.log('111111111111')
      const { signature, ...rest } = await provider.request({
        method: 'signAndSendTransaction',
        params: {
          transaction,
          // transaction: tx,
          connection: getConnection(),
        },
      })
      console.log('rest', rest)
      console.log('222222222222', signature)

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
