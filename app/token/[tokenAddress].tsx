import { Redirect, useLocalSearchParams } from 'expo-router'

/**
 * Deep link handler for https://cellar.so/token/{tokenAddress}?network=solana
 * Redirects to the token-detail screen with the tokenAddress param
 */
export default function TokenDeepLink() {
  const { tokenAddress, network } = useLocalSearchParams<{
    tokenAddress: string
    network?: string
  }>()

  // For now we only support Solana network
  // In the future, we could use the network param to handle different chains

  return (
    <Redirect
      href={{
        pathname: '/(screens)/token-detail',
        params: { tokenAddress },
      }}
    />
  )
}
