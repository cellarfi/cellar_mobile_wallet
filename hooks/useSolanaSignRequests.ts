import { SolanaRpcMethod } from '@/constants/App'
import { SolSignTransactionParams } from '@/dto/chain.dto'
import { eventEmitter } from '@/libs/EventEmitter.lib'
import { getConnection } from '@/libs/solana.lib'
import {
  EnhancedTransactionAnalyzer,
  EnhancedTransactionEffects,
} from '@/service/TransactionAnalyzer2'
import { useAuthStore } from '@/store/authStore'
import { useWebviewStore } from '@/store/webviewStore'
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js'
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

  const useTransactionAnalyzer = (
    connection: Connection,
    userAddress: string
  ) => {
    const analyzer = new EnhancedTransactionAnalyzer(connection, userAddress)

    const analyzeTransaction = async (
      transaction: Transaction | VersionedTransaction
    ): Promise<EnhancedTransactionEffects> => {
      return await analyzer.analyzeTransaction(transaction)
    }

    return { analyzeTransaction }
  }

  const { analyzeTransaction } = useTransactionAnalyzer(
    getConnection(),
    activeWallet?.address || ''
  )

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

  // const signSolanaTransaction = useCallback(
  //   async (args: {
  //     params: SolSignTransactionParams
  //     method: SolanaRpcMethod
  //   }) => {
  //     await new Promise((resolve, reject) => {
  //       eventEmitter.once('sign-transaction-modal-closed', (arg) => {
  //         if (arg.action === 'accept') {
  //           resolve(true)
  //         } else {
  //           reject(false)
  //         }
  //       })

  //       router.push({
  //         pathname: '/sign-transaction',
  //         params: {
  //           domain: tab?.baseUrl || '',
  //           websiteName: tab?.title || '',
  //           logoUrl: pageInfo?.iconUrl || '',
  //           isVerified: 'false',
  //           actionType: 'sign',
  //           //  tokenChanges: JSON.stringify(args.params.tokenChanges),
  //         },
  //       })
  //     })

  //     const signedTransactions: string[] = []

  //     // Process each transaction in the params array
  //     for (const [transactionBytes, requireAllSignatures] of args.params) {
  //       // transactionBytes is already a Uint8Array from the fromHex transform in your schema
  //       const transactionBuffer = transactionBytes

  //       let transaction: Transaction | VersionedTransaction

  //       try {
  //         // Try to deserialize as VersionedTransaction first (newer format)
  //         transaction = VersionedTransaction.deserialize(transactionBuffer)
  //       } catch (versionedError) {
  //         try {
  //           // Fall back to legacy Transaction if VersionedTransaction fails
  //           transaction = Transaction.from(transactionBuffer)
  //         } catch (legacyError) {
  //           console.error('Failed to deserialize transaction:', {
  //             versionedError,
  //             legacyError,
  //           })
  //           throw new Error('Invalid transaction format')
  //         }
  //       }

  //       // Sign the transaction using Privy
  //       const signedTransaction = await signTransaction(transaction)

  //       // Serialize the signed transaction back to base64
  //       let serializedTransaction: string

  //       if (signedTransaction instanceof VersionedTransaction) {
  //         serializedTransaction = Buffer.from(
  //           signedTransaction.serialize()
  //         ).toString('base64')
  //       } else {
  //         // Legacy Transaction
  //         serializedTransaction = Buffer.from(
  //           signedTransaction.serialize()
  //         ).toString('base64')
  //       }

  //       signedTransactions.push(serializedTransaction)
  //     }

  //     console.log('signedTransactions', signedTransactions)
  //     return signedTransactions
  //   },
  //   [pageInfo, tab, signAndSendTransaction]
  // )

  const signSolanaTransaction = useCallback(
    async (args: {
      params: SolSignTransactionParams
      method: SolanaRpcMethod
    }) => {
      // const transactionEffects: EnhancedTransactionEffects[] = []

      // // Analyze each transaction before showing the modal
      // for (const [transactionBytes, requireAllSignatures] of args.params) {
      //   const transactionBuffer = transactionBytes

      //   let transaction: Transaction | VersionedTransaction

      //   try {
      //     transaction = VersionedTransaction.deserialize(transactionBuffer)
      //   } catch (versionedError) {
      //     try {
      //       transaction = Transaction.from(transactionBuffer)
      //     } catch (legacyError) {
      //       console.error('Failed to deserialize transaction:', {
      //         versionedError,
      //         legacyError,
      //       })
      //       throw new Error('Invalid transaction format')
      //     }
      //   }

      //   // Analyze the transaction
      //   const effects = await analyzeTransaction(transaction)
      //   transactionEffects.push(effects)
      // }

      // const balanceChanges = transactionEffects
      //   .map((effect) => effect.balanceChanges)
      //   .flat()

      // console.log('transactionEffects', transactionEffects[0].decodedInstructions)

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
            // balanceChanges: JSON.stringify(balanceChanges),
            activeWallet: activeWallet?.address || '',
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

      console.log('signedTransactions', signedTransactions)
      return signedTransactions
    },
    [pageInfo, tab, signTransaction, activeWallet?.address]
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
            actionType: 'signAndSend',
            // balanceChanges: JSON.stringify(balanceChanges),
            activeWallet: activeWallet?.address || '',
          },
        })
      })

      if (args.method) throw new Error('Unknown error')

      const signedTransactions: string[] = []

      // Process each transaction in the params array
      for (const [transactionBytes, isVersioned] of args.params) {
        // transactionBytes is already a Uint8Array from the fromHex transform in the schema
        // isVersioned tells us whether this is a VersionedTransaction or legacy Transaction

        let transaction: Transaction | VersionedTransaction

        try {
          if (isVersioned) {
            // Deserialize as VersionedTransaction
            transaction = VersionedTransaction.deserialize(transactionBytes)
          } else {
            // Deserialize as legacy Transaction
            transaction = Transaction.from(transactionBytes)
          }
        } catch (error) {
          console.error('Failed to deserialize transaction:', error)
          throw new Error('Invalid transaction format')
        }

        console.log('Successfully recovered transaction:', transaction)

        // Sign the transaction using Privy (same as signSolanaTransaction)
        const signedTransaction = await signTransaction(transaction)

        // Manually send the signed transaction to Solana
        const connection = getConnection()

        // Ensure we have a Uint8Array for sendRawTransaction
        let serializedForSending: Uint8Array
        if (signedTransaction instanceof VersionedTransaction) {
          serializedForSending = signedTransaction.serialize()
        } else {
          // Legacy Transaction.serialize() returns Buffer, convert to Uint8Array
          const buffer = signedTransaction.serialize()
          serializedForSending = new Uint8Array(buffer)
        }

        const txSignature =
          await connection.sendRawTransaction(serializedForSending)

        console.log('Transaction sent successfully, signature:', txSignature)

        // Serialize the signed transaction back to base64 (similar to signSolanaTransaction)
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
      // // Process each transaction in the params array
      // for (const [transactionBytes, requireAllSignatures] of args.params) {
      //   // transactionBytes is already a Uint8Array from the fromHex transform in your schema
      //   const transactionBuffer = transactionBytes

      //   let transaction: Transaction | VersionedTransaction

      //   try {
      //     // Try to deserialize as VersionedTransaction first (newer format)
      //     transaction = VersionedTransaction.deserialize(transactionBuffer)
      //   } catch (versionedError) {
      //     try {
      //       // Fall back to legacy Transaction if VersionedTransaction fails
      //       transaction = Transaction.from(transactionBuffer)
      //     } catch (legacyError) {
      //       console.error('Failed to deserialize transaction:', {
      //         versionedError,
      //         legacyError,
      //       })
      //       throw new Error('Invalid transaction format')
      //     }
      //   }

      //   // Sign the transaction using Privy
      //   const signedTransaction = await signAndSendTransaction(transaction)

      //   // Serialize the signed transaction back to base64
      //   // let serializedTransaction: string

      //   // if (signedTransaction instanceof VersionedTransaction) {
      //   //   serializedTransaction = Buffer.from(
      //   //     signedTransaction.serialize()
      //   //   ).toString('base64')
      //   // } else {
      //   //   // Legacy Transaction
      //   //   serializedTransaction = Buffer.from(
      //   //     signedTransaction.serialize()
      //   //   ).toString('base64')
      //   // }

      //   signedTransactions.push(signedTransaction)
      // }

      // console.log('signedTransactions', signedTransactions)
      // return signedTransactions

      // Decode the Base64 string to a Buffer

      // const base64Transactions = args.params.map((param) =>
      //   Buffer.from(param[0]).toString('base64')
      // )

      // return Promise.all(
      //   []
      //   // signedTransactions.map(t => transport.broadcastTransaction(impl.network, t))
      // )
    },
    [pageInfo, tab, signAndSendTransaction, activeWallet?.address]
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
