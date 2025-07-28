import { type RefObject, useCallback, useEffect, useMemo, useRef } from 'react'
import { ZodError } from 'zod'

// import { useDappPermissionMutations, useDappPermissions } from '@/realm/dappIntegration';

import { SolanaRpcMethod } from '@/constants/App'
import {
  solSignMessageParamsSchema,
  solSignTransactionsParamsSchema,
} from '@/dto/chain.dto'
import { signRequest } from '@/libs/chains.helper'

import { eventEmitter } from '@/libs/EventEmitter.lib'
import { useAuthStore } from '@/store/authStore'
import { useWebviewStore } from '@/store/webviewStore'
import { ConnectionModalAction } from '@/types/app.interface'
import type {
  PostPageInfoWebViewRequest,
  RpcRequest,
  RpcRequestWebViewRequest,
  RpcResponse,
  SignedWebViewRequest,
  WebViewEvent,
  WebViewResponse,
} from '@/types/solana_type'
import { router } from 'expo-router'
import type { WebView, WebViewMessageEvent } from 'react-native-webview'
import { useSolanaSignRequests } from './useSolanaSignRequests'

export const useDappMethods = (
  webViewRef: RefObject<{ [key: string]: WebView }>,
  secret: string
) => {
  const { activeWallet } = useAuthStore()
  const { pageInfo, setPageInfo, tab } = useWebviewStore()

  // const hasPermissions = useDappPermissions(domain)
  // const hasPermissionsRef = useRef(hasPermissions)

  // useEffect(() => {
  //   hasPermissionsRef.current = hasPermissions
  // }, [hasPermissions])

  // const { revokePermissions, savePermission } = useDappPermissionMutations()
  const {
    signSolanaMessage,
    signSolanaTransaction,
    signAndSendSolanaTransaction,
  } = useSolanaSignRequests()

  const postMessage = useCallback(
    (responseOrEvent: WebViewResponse | WebViewEvent) => {
      const isEvent = 'network' in responseOrEvent

      console.log(`<-- sent ${isEvent ? 'event' : 'response'}`)
      console.log('<--', responseOrEvent)
      console.log('<--------')

      if (webViewRef.current) {
        const responseString = JSON.stringify(responseOrEvent)

        webViewRef.current[tab?.id || '']?.postMessage(responseString)
      }
    },
    [webViewRef, tab?.id]
  )
  const respond = useCallback(
    (requestId: string, result: RpcResponse = {}) =>
      postMessage({ id: requestId, result }),
    [postMessage]
  )
  const decline = useCallback(
    (requestId: string, message?: string, code?: number) =>
      respond(requestId, {
        error: {
          code: code ?? 4001,
          message: message ?? 'User declined the request',
        },
      }),
    [respond]
  )

  const handlePostPageInfoRequest = useCallback(
    (request: PostPageInfoWebViewRequest) => {
      setPageInfo(request.context)
    },
    [setPageInfo]
  )

  const solanaDisconnect = useCallback(() => {
    const disconnectEvent: WebViewEvent = {
      network: 'solana',
      name: 'disconnect',
      args: [],
    }

    postMessage(disconnectEvent)
  }, [postMessage])

  const handleSolanaRpcRequest = useCallback(
    async (requestId: string, request: RpcRequest) => {
      if (tab === null || tab.url === null) {
        throw new Error('domain or baseUrl is not defined')
      }

      // if (
      //   !shouldAllowWithoutPermission(request.method) &&
      //   !hasPermissionsRef.current
      // ) {
      //   return decline(requestId, loc.errors.permissionDenied)
      // }

      switch (request.method) {
        case SolanaRpcMethod.sol_connect: {
          // if (!hasPermissionsRef.current) {
          try {
            await // blockWalletConnectEvents(  () =>
            new Promise<boolean>((resolve, reject) => {
              eventEmitter.once(
                'wallet-connection-modal-closed',
                (action: ConnectionModalAction) => {
                  console.log('wallet-connection-modal-closed', action)
                  if (action === 'accept') {
                    resolve(true)
                  } else {
                    reject(false)
                  }
                }
              )

              router.push({
                pathname: '/(modals)/connect-wallet',
                params: {
                  domain: tab?.baseUrl || '',
                  websiteName: tab?.title || '',
                  logoUrl: pageInfo?.iconUrl || '',
                  isVerified: 'false',
                },
              })
            })
            // )
            // savePermission(domain)
          } catch (error) {
            if (error === false) {
              return decline(requestId)
            }

            throw error
          }
          // }

          const connectEvent: WebViewEvent = {
            network: 'solana',
            name: 'connect',
            args: [activeWallet?.address || ''],
          }

          postMessage(connectEvent)
          return respond(requestId, { result: activeWallet?.address || '' })
        }

        case SolanaRpcMethod.sol_disconnect: {
          // revokePermissions(domain)
          solanaDisconnect()
          return respond(requestId)
        }

        case SolanaRpcMethod.sol_signMessage: {
          try {
            const parsedParams = solSignMessageParamsSchema.parse(
              request.params
            )

            const signature = await signSolanaMessage(parsedParams[0])
            // const signature = await signSolanaMessage({
            //   wallet: solanaWallet,
            //   pageInfo,
            //   domain,
            //   baseUrl,
            //   message: parsedParams[0],
            //   address,
            // })

            // if (signature === null) {
            //   return decline(requestId)
            // }
            console.log('sol_signMessage signature', signature)

            return respond(requestId, {
              result: { signature, publicKey: activeWallet?.address || '' },
            })
          } catch (error) {
            if (error instanceof ZodError) {
              return decline(
                requestId,
                `Invalid ${request.method} request`,
                -32000
              )
            }

            console.log('sol_signMessage error', error)
            return decline(requestId, 'Something went wrong')
          }
        }

        case SolanaRpcMethod.sol_signTransactions: {
          try {
            const parsedParams = solSignTransactionsParamsSchema.parse(
              request.params
            )
            // console.log('sol_signTransactions parsedParams', parsedParams)
            // console.log('sol_signTransactions parsedParams', request)
            const signedTransactions = await signSolanaTransaction({
              params: parsedParams,
              method: request.method,
            })
            // const signedTransactions = await signSolanaTransaction({
            //   wallet: solanaWallet,
            //   pageInfo,
            //   domain,
            //   baseUrl,
            //   params: parsedParams,
            //   address,
            //   method: request.method,
            // })

            if (signedTransactions === null) {
              return decline(requestId)
            }

            return respond(requestId, {
              result: signedTransactions.map((t: any) =>
                Buffer.from(t, 'base64').toString('hex')
              ),
            })
          } catch (error) {
            if (error instanceof ZodError) {
              return decline(
                requestId,
                `Invalid ${request.method} request`,
                -32000
              )
            }

            console.log('sol_signTransactions error', error)
            return decline(requestId, 'Something went wrong')
          }
        }

        case SolanaRpcMethod.sol_signAndSendTransactions: {
          try {
            const parsedParams = solSignTransactionsParamsSchema.parse(
              request.params
            )

            const signatures = await signAndSendSolanaTransaction({
              params: parsedParams,
              method: request.method,
            })
            // const signatures = await signAndSendSolanaTransaction({
            //   wallet: solanaWallet,
            //   pageInfo,
            //   domain,
            //   baseUrl,
            //   params: parsedParams,
            //   address,
            //   method: request.method,
            // })

            if (signatures === null) {
              return decline(requestId)
            }

            return respond(requestId, {
              result: signatures.map((signature: any) => ({
                publicKey: activeWallet?.address || '',
                signature,
              })),
            })
          } catch (error) {
            if (error instanceof ZodError) {
              return decline(
                requestId,
                `Invalid ${request.method} request`,
                -32000
              )
            }

            console.log('sol_signAndSendTransactions error', error)
            return decline(requestId, 'Something went wrong')
          }
        }
      }
    },
    [
      respond,
      postMessage,
      // signSolanaMessage,
      // signSolanaTransaction,
      // signAndSendSolanaTransaction,
      activeWallet?.address,
      tab,
      pageInfo,
      decline,
      // openConnectModal,
      // savePermission,
      solanaDisconnect,
      // revokePermissions,
    ]
  )

  const requestQueueRef = useRef<RpcRequestWebViewRequest[]>([])

  useEffect(() => {
    requestQueueRef.current = []
  }, [tab?.baseUrl])

  const handleRpcRequest = useCallback(
    (request: RpcRequestWebViewRequest) => {
      console.log('--> received an RPC request')
      console.log('--> id:', request.id)
      console.log('--> method:', request.context.method)
      console.log('--> params:', request.context.params)
      console.log('-------->')

      switch (request.context.network) {
        case 'solana':
          return handleSolanaRpcRequest(request.id, request.context)
      }
    },
    [handleSolanaRpcRequest]
  )

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let message: SignedWebViewRequest

      try {
        message = JSON.parse(event.nativeEvent.data)
      } catch {
        return
      }

      const signature = signRequest(secret, message)

      // if (signature !== message.signature) {
      //   return postMessage({
      //     id: message.id,
      //     error: loc.errors.unauthorizedRequest,
      //   })
      // }

      switch (message.method) {
        case 'log':
          console.log('BROWSER LOG', message.context.message)
          break

        case 'post_page_info':
          return handlePostPageInfoRequest(message)

        case 'rpc_request': {
          requestQueueRef.current.push(message)
        }
      }
    },
    [secret, postMessage, handlePostPageInfoRequest]
  )

  const processRequestQueue = useCallback(
    async (context: { mounted: boolean }) => {
      if (requestQueueRef.current.length > 0) {
        const request = requestQueueRef.current.shift()!

        try {
          await handleRpcRequest(request)
        } catch (error) {
          console.log('processRequestQueue error', error)
          decline(request.id, 'Something went wrong', -32603)

          solanaDisconnect()
        }
      }

      if (context.mounted) {
        setTimeout(processRequestQueue, 250, context)
      }
    },
    [handleRpcRequest, decline, solanaDisconnect]
  )

  const memoizedProcessRequestQueue = useCallback(processRequestQueue, [
    handleRpcRequest,
    processRequestQueue,
  ])

  const manualDisconnect = useCallback(() => {
    if (tab?.baseUrl !== null) {
      solanaDisconnect()
    }
  }, [tab?.baseUrl, solanaDisconnect])

  useEffect(() => {
    const context = { mounted: true }

    memoizedProcessRequestQueue(context)
    return () => {
      context.mounted = false
    }
  }, [memoizedProcessRequestQueue])

  return useMemo(
    () => ({
      onMessage,
      disconnect: manualDisconnect,
    }),
    [onMessage, manualDisconnect]
  )
}
