import BiometricLockScreen from '@/components/BiometricLockScreen'
import { ENV } from '@/constants/Env'
import { useNetworkStore } from '@/store/networkStore'
import { PrivyProvider } from '@privy-io/expo'
import { PrivyElements } from '@privy-io/expo/ui'
import { DarkTheme, ThemeProvider } from '@react-navigation/native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Modal } from 'react-native'
import { AuthProvider, useAuthContext } from './AuthProvider'
import { ClusterProvider } from './ClusterProvider'
import { ConnectionProvider } from './ConnectionProvider'
import { RefreshProvider } from './RefreshProvider'

// Custom dark theme for crypto app
const CryptoDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#6366f1',
    background: '#0a0a0b',
    card: '#1a1a1f',
    text: '#ffffff',
    border: '#2d2d35',
    notification: '#6366f1',
  },
}

// Inner component that has access to auth context
const ProvidersInner = ({ children }: { children: React.ReactNode }) => {
  const { appIsLocked, unlockApp } = useAuthContext()

  return (
    <>
      <RefreshProvider>{children}</RefreshProvider>

      {/* Biometric Lock Screen Overlay */}
      <Modal
        visible={appIsLocked}
        animationType='fade'
        presentationStyle='fullScreen'
      >
        <BiometricLockScreen onUnlock={unlockApp} />
      </Modal>
    </>
  )
}

const Providers = ({ children }: { children: React.ReactNode }) => {
  // Create QueryClient with offline-aware configuration
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries when offline to prevent crashes
        retry: (failureCount, error) => {
          const { isOnline } = useNetworkStore.getState()

          // Don't retry if offline
          if (isOnline === false) {
            return false
          }

          // Default retry logic when online (max 3 retries)
          return failureCount < 3
        },
        // Disable background refetch when offline
        refetchOnWindowFocus: () => {
          const { isOnline } = useNetworkStore.getState()
          return isOnline === true
        },
        refetchOnReconnect: () => {
          const { isOnline } = useNetworkStore.getState()
          return isOnline === true
        },
        // Increase stale time to reduce unnecessary requests
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Cache data longer when offline
        gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
      },
      mutations: {
        // Disable mutation retries when offline
        retry: (failureCount, error) => {
          const { isOnline } = useNetworkStore.getState()

          // Don't retry mutations if offline
          if (isOnline === false) {
            return false
          }

          // Default retry logic when online (max 3 retries)
          return failureCount < 3
        },
      },
    },
  })

  return (
    <ThemeProvider value={CryptoDarkTheme}>
      <PrivyProvider
        appId={ENV.PRIVY_APP_ID!}
        clientId={ENV.PRIVY_APP_CLIENT_ID!}
        config={{
          embedded: {
            solana: {
              createOnLogin: 'users-without-wallets',
            },
          },
        }}
        // supportedChains={[]}
      >
        <PrivyElements config={{ appearance: { colorScheme: 'dark' } }} />
        <QueryClientProvider client={queryClient}>
          <ClusterProvider>
            <ConnectionProvider>
              <AuthProvider>
                <ProvidersInner>{children}</ProvidersInner>
              </AuthProvider>
            </ConnectionProvider>
          </ClusterProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </ThemeProvider>
  )
}

export default Providers
