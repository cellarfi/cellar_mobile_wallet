import { ENV } from '@/constants/Env'
import { PrivyProvider } from '@privy-io/expo'
import { PrivyElements } from '@privy-io/expo/ui'
import { DarkTheme, ThemeProvider } from '@react-navigation/native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './AuthProvider'
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

const Providers = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient()

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
                <RefreshProvider>{children}</RefreshProvider>
              </AuthProvider>
            </ConnectionProvider>
          </ClusterProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </ThemeProvider>
  )
}

export default Providers
