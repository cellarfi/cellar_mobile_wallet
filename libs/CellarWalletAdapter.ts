import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js'
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js'
import EventEmitter from 'events'

const APP_IDENTITY = {
  name: 'Cellar',
  uri: 'https://yourapp.com', // Replace with your app’s website
  icon: 'data:image/svg+xml;base64,PHN2ZyBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAyODAuMTczIDI4MC4xNzMiIHZpZXdCb3g9IjAgMCAyODAuMTczIDI4MC4xNzMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0ibTEzMy45NjEuMTQ1Yy03MC44ODIgMy41LTEyNS4xMzcgNjMuODgxLTEyNS4xMzcgMTM0Ljc2M3Y2Ni41MDYgNjUuNjMxYzAgNi4xMjYgNi4xMjYgOS42MjYgMTEuMzc2IDYuMTI2bDIwLjEyNy0xMi4yNTFjNy44NzYtNC4zNzUgMTcuNTAyLTQuMzc1IDI1LjM3NyAwbDE4LjM3NyAxMC41MDFjNy44NzYgNC4zNzUgMTcuNTAyIDQuMzc1IDI1LjM3NyAwbDE4LjM3Ny0xMC41MDFjNy44NzYtNC4zNzUgMTcuNTAyLTQuMzc1IDI1LjM3NyAwbDE4LjM3NyAxMC41MDFjNy44NzYgNC4zNzUgMTcuNTAyIDQuMzc1IDI1LjM3NyAwbDE4LjM3Ny0xMC41MDFjNy44NzYtNC4zNzUgMTcuNTAyLTQuMzc1IDI1LjM3NyAwbDE5LjI1MiAxMS4zNzZjNS4yNTEgMi42MjUgMTEuMzc2LS44NzUgMTEuMzc2LTYuMTI2IDAtMTguMzc3IDAtNTAuNzU1IDAtNjUuNjMxdi03MC4wMDdjLjAwMS03My41MDctNjIuMTMtMTMzLjg4Ny0xMzcuMzg3LTEzMC4zODd6IiBmaWxsPSIjZTI1NzRjIi8+PHBhdGggZD0ibTI2LjMyNSAxMzEuNDA4YzAtNjkuMTMyIDU0LjI1NS0xMjYuMDEyIDEyMi41MTItMTMxLjI2My0yLjYyNSAwLTYuMTI2IDAtOC43NTEgMC03Mi42MzIgMC0xMzEuMjYyIDU4LjYzMS0xMzEuMjYyIDEzMS4yNjN2MTQ4Ljc2NWM3Ljg3NiAwIDEzLjEyNi0zLjUgMTcuNTAyLTcuODc2LS4wMDEtMTUuNzUyLS4wMDEtMTQwLjg4OS0uMDAxLTE0MC44ODl6IiBmaWxsPSIjZDI1MTQ3Ii8+PHBhdGggZD0ibTE4OC4yMTYgMTEzLjkwNmMtMTYuNjI3IDAtMzAuNjI4IDE0LjAwMS0zMC42MjggMzAuNjI4czE0LjAwMSAzMC42MjggMzAuNjI4IDMwLjYyOCAzMC42MjgtMTQuMDAxIDMwLjYyOC0zMC42MjgtMTQuMDAxLTMwLjYyOC0zMC42MjgtMzAuNjI4em0tOTYuMjU5IDBjLTE2LjYyNyAwLTMwLjYyOCAxNC4wMDEtMzAuNjI4IDMwLjYyOHMxNC4wMDEgMzAuNjI4IDMwLjYyOCAzMC42MjggMzAuNjI4LTE0LjAwMSAzMC42MjgtMzAuNjI4LTE0LjAwMi0zMC42MjgtMzAuNjI4LTMwLjYyOHoiIGZpbGw9IiNlNGU3ZTciLz48cGF0aCBkPSJtMTg4LjIxNiAxMzEuNDA4Yy03LjAwMSAwLTEzLjEyNiA2LjEyNi0xMy4xMjYgMTMuMTI2IDAgNy4wMDEgNi4xMjYgMTMuMTI2IDEzLjEyNiAxMy4xMjZzMTMuMTI2LTYuMTI2IDEzLjEyNi0xMy4xMjZjMC03LjAwMS02LjEyNS0xMy4xMjYtMTMuMTI2LTEzLjEyNnptLTk2LjI1OSAwYy03LjAwMSAwLTEzLjEyNiA2LjEyNi0xMy4xMjYgMTMuMTI2IDAgNy4wMDEgNi4xMjYgMTMuMTI2IDEzLjEyNiAxMy4xMjYgNy4wMDEgMCAxMy4xMjYtNi4xMjYgMTMuMTI2LTEzLjEyNiAwLTcuMDAxLTYuMTI2LTEzLjEyNi0xMy4xMjYtMTMuMTI2eiIgZmlsbD0iIzMyNGQ1YiIvPjwvc3ZnPg==',
}

export class CellarWalletAdapter extends EventEmitter {
  private _publicKey: PublicKey | null = null
  private _connected: boolean = false
  private _connecting: boolean = false

  constructor() {
    super()
    this._publicKey = null
    this._connected = false
    this._connecting = false
  }

  get publicKey() {
    return this._publicKey
  }

  get connected() {
    return this._connected
  }

  get connecting() {
    return this._connecting
  }

  async connect(): Promise<void> {
    if (this._connected || this._connecting) return
    this._connecting = true

    try {
      const authorizationResult = await transact(
        async (wallet: Web3MobileWallet) => {
          const auth = await wallet.authorize({
            cluster: 'mainnet-beta', // Use 'mainnet-beta' for mainnet
            identity: APP_IDENTITY,
          })
          return auth
        }
      )

      this._publicKey = new PublicKey(authorizationResult.accounts[0].address)
      this._connected = true
      this.emit('connect', this._publicKey)
    } catch (error: any) {
      this.emit('error', new Error('Connection failed: ' + error.message))
      throw error
    } finally {
      this._connecting = false
    }
  }

  async disconnect(): Promise<void> {
    if (!this._connected) return
    this._publicKey = null
    this._connected = false
    this.emit('disconnect')
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this._connected || !this._publicKey) {
      throw new Error('Wallet not connected')
    }
    try {
      const signedTransaction = await transact(
        async (wallet: Web3MobileWallet) => {
          const signedTxs = await wallet.signTransactions({
            transactions: [transaction],
          })
          return signedTxs[0]
        }
      )
      return signedTransaction
    } catch (error: any) {
      this.emit(
        'error',
        new Error('Transaction signing failed: ' + error.message)
      )
      throw error
    }
  }

  async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    if (!this._connected || !this._publicKey) {
      throw new Error('Wallet not connected')
    }
    try {
      const signedTransactions = await transact(
        async (wallet: Web3MobileWallet) => {
          const signedTxs = await wallet.signTransactions({
            transactions,
          })
          return signedTxs
        }
      )
      return signedTransactions
    } catch (error: any) {
      this.emit(
        'error',
        new Error('Batch transaction signing failed: ' + error.message)
      )
      throw error
    }
  }

  async signAndSendTransaction(
    transaction: Transaction,
    connection: Connection,
    options: SendOptions = {}
  ): Promise<TransactionSignature> {
    if (!this._connected || !this._publicKey) {
      throw new Error('Wallet not connected')
    }
    try {
      const signedTransaction = await this.signTransaction(transaction)
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        options
      )
      return signature
    } catch (error: any) {
      this.emit('error', new Error('Send transaction failed: ' + error.message))
      throw error
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this._connected || !this._publicKey) {
      throw new Error('Wallet not connected')
    }
    try {
      const signedMessage = await transact(async (wallet: Web3MobileWallet) => {
        const signed = await wallet.signMessages({
          payloads: [message],
        })
        return signed[0]
      })
      return signedMessage
    } catch (error: any) {
      this.emit('error', new Error('Message signing failed: ' + error.message))
      throw error
    }
  }
}
