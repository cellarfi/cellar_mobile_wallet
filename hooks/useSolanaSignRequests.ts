import { SolanaRpcMethod } from '@/constants/App'
import { SolSignTransactionParams } from '@/dto/chain.dto'
import { eventEmitter } from '@/libs/EventEmitter.lib'
import { getConnection } from '@/libs/solana.lib'
import { useAuthStore } from '@/store/authStore'
import { useWebviewStore } from '@/store/webviewStore'
import { Transaction, VersionedTransaction } from '@solana/web3.js'
import { router } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { usePrivySign } from './usePrivySign'

export const useSolanaSignRequests = () => {
  const { activeWallet } = useAuthStore()
  const { tab, pageInfo } = useWebviewStore()
  const {
    signMessage,
    signTransaction,
    signAndSendTransaction,
    isWalletConnected,
  } = usePrivySign()

  const signSolanaMessage = useCallback(
    async (message: Uint8Array) => {
      const textDecoder = new TextDecoder()
      const decodedMessage = textDecoder.decode(message)

      await new Promise((resolve, reject) => {
        eventEmitter.once('sign-message-modal-closed', (arg) => {
          if (arg.action === 'accept') {
            resolve(true)
          } else {
            reject(false)
          }
        })

        router.push({
          pathname: '/sign-message',
          params: {
            domain: tab?.baseUrl || '',
            websiteName: tab?.title || '',
            logoUrl: pageInfo?.iconUrl || '',
            isVerified: 'false',
            message: decodedMessage,
          },
        })
      })

      const signature = await signMessage(
        Buffer.from(message).toString('base64')
      )

      return Buffer.from(signature, 'base64').toString('hex')
    },
    [pageInfo, tab, signMessage]
  )

  const signSolanaTransaction = useCallback(
    async (args: {
      params: SolSignTransactionParams
      method: SolanaRpcMethod
    }) => {
      await new Promise((resolve, reject) => {
        eventEmitter.once('sign-transaction-modal-closed', (arg) => {
          if (arg.action === 'accept') {
            resolve(true)
          } else {
            reject(false)
          }
        })

        router.push({
          pathname: '/sign-transaction',
          params: {
            domain: tab?.baseUrl || '',
            websiteName: tab?.title || '',
            logoUrl: pageInfo?.iconUrl || '',
            isVerified: 'false',
            actionType: 'sign',
            //  tokenChanges: JSON.stringify(args.params.tokenChanges),
          },
        })
      })

      const signedTransactions: string[] = []

      // Process each transaction in the params array
      for (const [transactionBytes, requireAllSignatures] of args.params) {
        // transactionBytes is already a Uint8Array from the fromHex transform in your schema
        const transactionBuffer = transactionBytes

        let transaction: Transaction | VersionedTransaction

        try {
          // Try to deserialize as VersionedTransaction first (newer format)
          transaction = VersionedTransaction.deserialize(transactionBuffer)
        } catch (versionedError) {
          try {
            // Fall back to legacy Transaction if VersionedTransaction fails
            transaction = Transaction.from(transactionBuffer)
            console.log(
              'transaction.getEstimatedFee(getConnection())',
              transaction.getEstimatedFee(getConnection())
            )
            console.log('transaction', transaction)
          } catch (legacyError) {
            console.error('Failed to deserialize transaction:', {
              versionedError,
              legacyError,
            })
            throw new Error('Invalid transaction format')
          }
        }

        // Sign the transaction using Privy
        const signedTransaction = await signTransaction(transaction)

        // Serialize the signed transaction back to base64
        let serializedTransaction: string

        if (signedTransaction instanceof VersionedTransaction) {
          serializedTransaction = Buffer.from(
            signedTransaction.serialize()
          ).toString('base64')
        } else {
          // Legacy Transaction
          serializedTransaction = Buffer.from(
            signedTransaction.serialize()
          ).toString('base64')
        }

        signedTransactions.push(serializedTransaction)
      }

      return signedTransactions
    },
    [pageInfo, tab, signAndSendTransaction]
  )

  const signAndSendSolanaTransaction = useCallback(
    async (args: {
      params: SolSignTransactionParams
      method: SolanaRpcMethod
    }) => {
      await new Promise((resolve, reject) => {
        eventEmitter.once('sign-transaction-modal-closed', (arg) => {
          if (arg.action === 'accept') {
            resolve(true)
          } else {
            reject(false)
          }
        })

        router.push({
          pathname: '/sign-transaction',
          params: {
            domain: tab?.baseUrl || '',
            websiteName: tab?.title || '',
            logoUrl: pageInfo?.iconUrl || '',
            isVerified: 'false',
            actionType: 'sign',
            //  tokenChanges: JSON.stringify(args.params.tokenChanges),
          },
        })
      })

      const base64Transactions = args.params.map((param) =>
        Buffer.from(param[0]).toString('base64')
      )

      console.log(
        'signAndSendSolanaTransaction base64Transactions',
        base64Transactions
      )

      // const preparedTransactions = await Promise.all(
      //   base64Transactions.map((transaction) =>
      //     transport.prepareTransaction(
      //       impl.network,
      //       args.wallet,

      //       undefined as any,
      //       {
      //         dAppOrigin: args.baseUrl,
      //         transaction,
      //       }
      //     )
      //   )
      // )

      // if (preparedTransactions.some((t) => t.isError)) {
      //   throw new Error('Some of the transaction simulations failed')
      // }

      // const warning = preparedTransactions
      //   .map((t) => getWarningFromSimulation(t.preventativeAction, t.warnings))
      //   .find((w) => w !== undefined)
      // const { transactionTitle, content } =
      //   await getSignStructuredParamsFromTransaction({
      //     method: args.method,
      //     preparedTransaction: preparedTransactions[0],
      //     network: impl.network,
      //     currency,
      //   })
      // const tx = await signAndSendTransaction(args.params)

      // const signedTransactions = await signSolanaTransaction(args);
      // if (signedTransactions === null) {
      //   return null;
      // }
      // const impl = getImplForWallet(args.wallet);
      // if (!isSolanaTransport(impl.transport)) {
      //   throw new Error(`Can't broadcast a Solana transaction with a non-Solana transport`);
      // }
      // const transport: SolanaHarmonyTransport = impl.transport;
      return Promise.all(
        []
        // signedTransactions.map(t => transport.broadcastTransaction(impl.network, t))
      )
    },
    [signSolanaTransaction]
  )

  return useMemo(
    () => ({
      signSolanaMessage,
      signSolanaTransaction,
      signAndSendSolanaTransaction,
    }),
    [signSolanaMessage, signSolanaTransaction, signAndSendSolanaTransaction]
  )
}
