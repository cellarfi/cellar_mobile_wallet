import type { Platform } from 'react-native'

import type {
  EventEmitter,
  ListenerItem,
  Provider,
  SolanaProvider,
  UnsignedWebViewRequest,
  WalletStandardAccount,
  WalletStandardRegisterApi,
  WalletStandardRegisterApiCallback,
  WalletStandardWallet,
  WebViewEvent,
  WebViewRequest,
  WebViewRequestContext,
  WebViewRequestResult,
  WebViewResponse,
} from '../types/solana_type'

import type {
  PublicKey,
  SendOptions,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js'

function injectProviders(
  secret: string,
  platform: typeof Platform.OS,
  solanaSdk: any
) {
  'show source'

  if (window.solana !== undefined) {
    return
  }

  const encoder = new TextEncoder()
  const requestMap = new Map<
    string,
    {
      resolve: (value: WebViewResponse['result']) => void
      reject: (error: Error) => void
    }
  >()

  function createEventEmitter(): EventEmitter {
    const listenersMap = new Map<string, ListenerItem[]>()

    function addListener(eventName: string, item: ListenerItem): void {
      if (!listenersMap.has(eventName)) {
        listenersMap.set(eventName, [item])
        return
      }

      listenersMap.get(eventName)!.push(item)
    }

    return {
      on(eventName, listener) {
        addListener(eventName, { func: listener })
        return this
      },
      addListener(eventName, listener) {
        return this.on(eventName, listener)
      },
      once(eventName, listener) {
        addListener(eventName, { func: listener, once: true })
        return this
      },
      emit(eventName, ...args) {
        if (!listenersMap.has(eventName)) {
          return false
        }

        const listeners = listenersMap.get(eventName)!

        listeners.forEach((listener) => {
          listener.func(...args)

          if (listener.once) {
            this.removeListener(eventName, listener.func)
          }
        })
        return listeners.length > 0
      },
      eventNames() {
        return Array.from(listenersMap.keys())
      },
      listenerCount(eventName, listener?) {
        if (!listenersMap.has(eventName)) {
          return 0
        }

        const listeners = listenersMap.get(eventName)!

        if (listener === undefined) {
          return listeners.length
        }

        return listeners.reduce(
          (count, { func }) => (func === listener ? count + 1 : count),
          0
        )
      },
      listeners(eventName) {
        if (!listenersMap.has(eventName)) {
          return []
        }

        return listenersMap.get(eventName)!.map(({ func }) => func)
      },
      removeListener(eventName, listener) {
        if (!listenersMap.has(eventName)) {
          return this
        }

        const listeners = listenersMap.get(eventName)!
        const index = listeners.findIndex(({ func }) => func === listener)

        if (index !== -1) {
          listeners.splice(index, 1)
        }

        return this
      },
      off(eventName, listener) {
        return this.removeListener(eventName, listener)
      },
      removeAllListeners(eventName) {
        listenersMap.delete(eventName)
        return this
      },
    }
  }

  function toHex(data: Uint8Array) {
    return Array.from(data)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  function fromHex(data: string) {
    const result = new Uint8Array(data.length / 2)

    for (let i = 0, l = data.length; i < l; i += 2) {
      result[i / 2] = parseInt(data.substring(i, i + 2), 16)
    }

    return result
  }

  function signRequest(request: UnsignedWebViewRequest): Promise<string> {
    const requestString = JSON.stringify(request)
    const requestBuffer = encoder.encode(requestString)
    const secretBuffer = fromHex(secret)
    const algorithm = { name: 'HMAC', hash: { name: 'SHA-256' } }

    return window.crypto.subtle
      .importKey('raw', secretBuffer, algorithm, false, ['sign'])
      .then((key) => window.crypto.subtle.sign(algorithm, key, requestBuffer))
      .then((signature) => toHex(new Uint8Array(signature)))
  }

  function request<Method extends WebViewRequest['method']>(
    method: Method,
    context: WebViewRequestContext[Method]
  ): Promise<WebViewRequestResult[Method]> {
    const requestId = window.crypto.randomUUID()
    const unsignedRequest = {
      id: requestId,
      method,
      context,
    }

    return signRequest(unsignedRequest).then(
      (signature) =>
        new Promise<WebViewRequestResult[Method]>((resolve, reject) => {
          const signedRequest = {
            ...unsignedRequest,
            signature,
          }
          const signedRequestString = JSON.stringify(signedRequest)

          if (method === 'rpc_request') {
            // @ts-expect-error TS can not narrow resolve type based on method
            requestMap.set(requestId, { resolve, reject })
          } else {
            // @ts-expect-error ☝️☝️☝️
            resolve()
          }

          window.ReactNativeWebView.postMessage(signedRequestString)
        })
    )
  }

  function rpcRequest(context: WebViewRequestContext['rpc_request']) {
    return request('rpc_request', context).then((rpcResponse) => {
      if (rpcResponse.result !== undefined) {
        return rpcResponse.result as any
      }

      return Promise.reject(
        rpcResponse.error ?? { code: 4900, message: 'Unexpected error' }
      )
    })
  }

  function log(message: any): void {
    request('log', { message })
  }

  function postPageInfo(): void {
    const metaElement = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-title"]'
    )
    const linkElement =
      document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
      document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')

    request('post_page_info', {
      iconUrl: linkElement?.href,
      title: metaElement?.getAttribute('content') ?? undefined,
    })
  }

  function serializeTransaction(
    transaction: Transaction | VersionedTransaction
  ) {
    return 'version' in transaction
      ? transaction.serialize()
      : new Uint8Array(
          transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          })
        )
  }

  const solanaProvider: SolanaProvider = (() => {
    function toPublicKey(stringOrBuffer: string | Uint8Array): PublicKey {
      return new solanaSdk.PublicKey(stringOrBuffer)
    }

    function toTransaction(
      data: string,
      versioned?: boolean
    ): Transaction | VersionedTransaction {
      if (versioned) {
        return solanaSdk.VersionedTransaction.deserialize(fromHex(data))
      }

      return solanaSdk.Transaction.from(fromHex(data))
    }

    function SolanaError(this: any, error: any) {
      Error.call(this, error.message)
      Object.setPrototypeOf(this, SolanaError.prototype)

      this.code = error.code
    }

    SolanaError.prototype = Object.create(Error.prototype)
    SolanaError.prototype.constructor = SolanaError

    SolanaError.prototype.toString = function () {
      return this.message
    }

    function solanaRpcRequest(context: WebViewRequestContext['rpc_request']) {
      return rpcRequest(context).catch((error) => {
        // @ts-expect-error legacy class syntax
        throw new SolanaError(error)
      })
    }

    function signTransactions(
      transactions: (Transaction | VersionedTransaction)[]
    ): Promise<(Transaction | VersionedTransaction)[]> {
      const versioned = transactions.map((t) => 'version' in t)
      const serializedTransactions = transactions.map((t) =>
        toHex(serializeTransaction(t))
      )

      return solanaRpcRequest({
        method: 'sol_signTransactions',
        params: serializedTransactions.map((t, i) => [t, versioned[i]]),
        network: 'solana',
      }).then((rpcResult) =>
        rpcResult.map((item: string, i: number) =>
          toTransaction(item, versioned[i])
        )
      )
    }

    function signAndSendTransactions(
      transactions: (Transaction | VersionedTransaction)[],
      _options?: SendOptions
    ): Promise<{ publicKey: string; signature: string }[]> {
      const serializedTransactions = transactions.map((t) =>
        toHex(serializeTransaction(t))
      )

      return solanaRpcRequest({
        method: 'sol_signAndSendTransactions',
        params: serializedTransactions.map((t, i) => [
          t,
          'version' in transactions[i],
        ]),
        network: 'solana',
      })
    }

    const eventEmitter = createEventEmitter()

    return {
      ...eventEmitter,

      isCellar: true as const,
      publicKey: null,

      get isConnected() {
        return this.publicKey !== null
      },
      on(eventName, listener) {
        if (eventName === 'connect') {
          return eventEmitter.on('connect', (publicKeyString: string) => {
            return listener(toPublicKey(publicKeyString))
          })
        }

        return eventEmitter.on(eventName, listener)
      },
      connect() {
        return solanaRpcRequest({
          method: 'sol_connect',
          network: 'solana',
        }).then((rpcResult) => {
          this.publicKey = toPublicKey(rpcResult)

          return {
            publicKey: this.publicKey!,
          }
        })
      },
      disconnect() {
        if (!this.isConnected) {
          return Promise.resolve()
        }

        return solanaRpcRequest({
          method: 'sol_disconnect',
          network: 'solana',
        }).then(() => {
          this.publicKey = null
        })
      },
      signMessage(message, encoding = 'utf8') {
        return solanaRpcRequest({
          method: 'sol_signMessage',
          params: [toHex(message), encoding],
          network: 'solana',
        }).then((rpcResult) => {
          return {
            signature: fromHex(rpcResult.signature),
            publicKey: toPublicKey(rpcResult.publicKey),
          }
        })
      },
      signTransaction(transaction) {
        return signTransactions([transaction]).then(
          (signedTransactions) => signedTransactions[0]
        )
      },
      signAllTransactions(transactions) {
        return signTransactions(transactions)
      },
      signAndSendTransaction(
        transaction: Transaction | VersionedTransaction,
        options?: SendOptions
      ) {
        return signAndSendTransactions([transaction], options).then(
          (results) => results[0]
        )
      },
      signAndSendAllTransactions(
        transactions: (Transaction | VersionedTransaction)[],
        options?: SendOptions
      ) {
        return signAndSendTransactions(transactions, options).then(
          (results) => ({
            publicKey: results[0].publicKey,
            signatures: results.map((result) => result.signature),
          })
        )
      },
    }
  })()

  const SOLANA_CHAINS = ['solana:mainnet', 'solana:devnet']

  function createWalletStandardAccount(
    publicKey: PublicKey
  ): WalletStandardAccount {
    const address = publicKey.toBase58()
    const publicKeyAsBytes = publicKey.toBytes()
    const features = [
      'solana:signAndSendTransaction',
      'solana:signTransaction',
      'solana:signMessage',
    ]

    return {
      get address() {
        return address
      },
      get publicKey() {
        return publicKeyAsBytes.slice()
      },
      get chains() {
        return SOLANA_CHAINS.slice()
      },
      get features() {
        return features.slice()
      },
    }
  }

  function createWalletStandardWallet(
    icon: string,
    name: string,
    provider: SolanaProvider
  ) {
    let account: WalletStandardAccount | null = null
    const eventEmitter = createEventEmitter()

    function handleConnection(publicKey: PublicKey) {
      const address = publicKey.toBase58()

      if (account === null || account.address !== address) {
        account = createWalletStandardAccount(publicKey)

        eventEmitter.emit('change', { accounts: [account] })
      }
    }

    const wallet: WalletStandardWallet = {
      get version() {
        return '1.0.0' as const
      },
      get name() {
        return name
      },
      get icon() {
        return icon
      },
      get chains() {
        return SOLANA_CHAINS.slice()
      },
      get accounts() {
        if (account === null) {
          return []
        }

        return [account]
      },
      get features() {
        return {
          'standard:events': {
            version: '1.0.0' as const,
            on: this.on,
          },
          'standard:connect': {
            version: '1.0.0' as const,
            connect: this.connect,
          },
          'standard:disconnect': {
            version: '1.0.0' as const,
            disconnect: this.disconnect,
          },
          'solana:signAndSendTransaction': {
            version: '1.0.0' as const,
            supportedTransactionVersions: ['legacy', 0],
            signAndSendTransaction: this.signAndSendTransaction,
          },
          'solana:signTransaction': {
            version: '1.0.0' as const,
            supportedTransactionVersions: ['legacy', 0],
            signTransaction: this.signTransaction,
          },
          'solana:signMessage': {
            version: '1.0.0' as const,
            signMessage: this.signMessage,
          },
        }
      },

      on(eventName, listener) {
        eventEmitter.on(eventName, listener)
        return () => eventEmitter.off(eventName, listener)
      },
      connect() {
        if (account !== null) {
          return Promise.resolve({ accounts: this.accounts })
        }

        return provider.connect().then((result) => {
          handleConnection(result.publicKey)
          return { accounts: this.accounts }
        })
      },
      disconnect() {
        log('disconnect is called')
        return provider.disconnect()
      },
      signMessage(...inputs) {
        if (account === null) {
          throw new Error('Not connected')
        }

        return Promise.all(
          inputs.map((input) => {
            if (input.account !== account) {
              throw new Error('Invalid account')
            }

            return provider.signMessage(input.message).then((result) => {
              return {
                signedMessage: input.message,
                signature: result.signature,
              }
            })
          })
        )
      },
      signTransaction(...inputs) {
        if (account === null) {
          throw new Error('Not connected')
        }

        const chains = new Set(
          inputs
            .filter((input) => input.chain !== undefined)
            .map((input) => input.chain)
        )

        if (chains.size > 1) {
          throw new Error('Conflicting chains')
        }

        return Promise.all(
          inputs.map((input) => {
            if (input.account !== account) {
              throw new Error('Invalid account')
            }

            if (
              input.chain !== undefined &&
              !input.chain.startsWith('solana:')
            ) {
              throw new Error('Invalid chain')
            }

            return provider
              .signTransaction(
                solanaSdk.VersionedTransaction.deserialize(input.transaction)
              )
              .then((result) => {
                return {
                  signedTransaction: serializeTransaction(result),
                }
              })
          })
        )
      },
      signAndSendTransaction(...inputs) {
        if (account === null) {
          throw new Error('Not connected')
        }

        const chains = new Set(inputs.map((input) => input.chain))

        if (chains.size > 1) {
          throw new Error('Conflicting chains')
        }

        return Promise.all(
          inputs.map((input) => {
            if (input.account !== account) {
              throw new Error('Invalid account')
            }

            if (!input.chain.startsWith('solana:')) {
              throw new Error('Invalid chain')
            }

            return provider
              .signAndSendTransaction(
                solanaSdk.VersionedTransaction.deserialize(input.transaction),
                input.options
              )
              .then((result) => {
                return {
                  signature: result.signature,
                }
              })
          })
        )
      },
      signAndSendAllTransaction(inputs) {
        return this.signAndSendTransaction(...inputs)
      },
    }

    provider.on('connect', handleConnection)
    provider.on('disconnect', () => {
      account = null

      eventEmitter.emit('change', { accounts: [] })
    })

    return wallet
  }

  function handleMessageEvent(messageEvent: MessageEvent<string> | Event) {
    if (!(messageEvent instanceof MessageEvent)) {
      return
    }

    try {
      const responseOrEvent = JSON.parse(messageEvent.data) as
        | WebViewResponse
        | WebViewEvent

      if ('network' in responseOrEvent) {
        const provider: Provider = solanaProvider

        provider.emit(responseOrEvent.name, ...responseOrEvent.args)
        return
      }

      if (requestMap.has(responseOrEvent.id)) {
        const { resolve, reject } = requestMap.get(responseOrEvent.id)!

        if (responseOrEvent.error !== undefined) {
          reject(new Error(responseOrEvent.error))
        } else {
          resolve(responseOrEvent.result)
        }

        requestMap.delete(responseOrEvent.id)
      }
    } catch {}
  }

  if (platform === 'ios') {
    window.addEventListener('message', handleMessageEvent)
  } else {
    document.addEventListener('message', handleMessageEvent)
  }

  postPageInfo()

  window.solana = solanaProvider

  const name = 'Cellar'
  const icon =
    'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMiIgZGF0YS1uYW1lPSJMYXllciAyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MjIuODEgNzI0LjI3Ij4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xIHsKICAgICAgICBmaWxsOiAjMDBjMmNiOwogICAgICB9CiAgICA8L3N0eWxlPgogIDwvZGVmcz4KICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik00NzIuNzgsMjU3LjY1bDE1MC4wMy0xNDkuMDJDNTEzLjY5LS42MywzNDguMjEtMzAuNjUsMjEwLjQ4LDMzLjExLDgwLjY5LDkzLjItMi4xNSwyMjYuMjQuMDQsMzcxLjQzYzMuNzYsMTQ1LjIxLDk0LjA2LDI3NC42NCwyMjguNTcsMzI3Ljc1LDEzMi4wOCw1Mi4xNSwyODMuNTMsMjEuNTMsMzg1LjY0LTc4LjAzLTQ5Ljg0LTQ5LjY3LTk5LjY4LTk5LjM1LTE0OS41Mi0xNDkuMDItMTMuMjksMTIuNS0zNS45NSwyOS42Ny02Ny45NywzNy4yNi00Mi45MiwxMC4xNy05OC4xMSwyLjA2LTEzNC40NC0zNS43MS0xNy43My0xOC40My0yNS44NS0zOC42LTI5LjY5LTUwLjg5LDI1LjU5LTIuMjgsNDcuMzUtNC40OSw2NC4yMi02LjMsMzkuMDEtNC4xOCwyOS42Ni0zLjgzLDQ0LjY5LTUuMTEsMTQuNzgtMS4yNywyOC4yMy0xLjk4LDQ2Ljk5LTYuMzcsNS40LTEuMjYsOS44LTIuNDksMTIuNzUtMy4zNi05OC4xOCw0LjEtMTc3LjQyLTIuNjEtMjMzLjYtMTAuMDctMzMuMTEtNC4zOS0xMDAuNTUtMTMuNjEtMTAwLjY5LTI2LjY4LS4xNC0xMy4yNyw2OS4wOS0yNi43NywxMDIuMi0zMy4yMywxOS4zNS0zLjc3LDM1LjU2LTYuMTEsNDYuODItNy41NSw0LjIzLTEzLjYyLDE5LjItNTUuNjksNjIuNDMtODUuNTksMTEuMzctNy44Niw0NS44Ni0zMC45Nyw5NC42NS0yOC4xOSw1Ni40NSwzLjIxLDkxLjY3LDM4Ljc5LDk5LjY4LDQ3LjMyWiIvPgo8L3N2Zz4='

  const walletStandardWallet = createWalletStandardWallet(
    icon,
    name,
    solanaProvider
  )
  const walletStandardEvent =
    new CustomEvent<WalletStandardRegisterApiCallback>(
      'wallet-standard:register-wallet',
      {
        detail: ({ register }) => {
          register(walletStandardWallet)
        },
      }
    )

  window.addEventListener('wallet-standard:app-ready', (event) => {
    if ('detail' in event) {
      const typedEvent = event as CustomEvent<WalletStandardRegisterApi>

      typedEvent.detail.register(walletStandardWallet)
    }
  })

  window.dispatchEvent(walletStandardEvent)
  log('\n\n\nHello from the injected script!')
}

export const getInjectedScriptString = (
  secret: string,
  platform: typeof Platform.OS,
  solanaSdk: string
) =>
  `window.onerror = function(message, sourcefile, lineno, colno, error) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'js-error',
        message: message,
        sourcefile: sourcefile,
        lineno: lineno,
        colno: colno,
        error: error,
      }))
      return true;
    };
    true;
  (function(){${solanaSdk}(${injectProviders.toString()})('${secret}','${platform}', solanaWeb3);})();`

console.log('injected script:', injectProviders.toString().substring(0, 100))
