import { Stack } from 'expo-router'

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerShown: false,
      }}
    >
      <Stack.Screen name='token-detail' />
      <Stack.Screen name='send' />
      <Stack.Screen name='receive' />
      <Stack.Screen name='swap' />
      <Stack.Screen name='buy-crypto' />
      <Stack.Screen name='nft-detail' />
      <Stack.Screen name='wallet-switcher' />
      {/* <Stack.Screen name='create-post' /> */}
      {/* <Stack.Screen name='tip-user' /> */}
      <Stack.Screen name='post-comments' />
      {/* <Stack.Screen name='edit-profile' /> */}
      <Stack.Screen name='manage-wallets' />
      {/* <Stack.Screen name='security-settings' /> */}
      {/* <Stack.Screen name='notification-settings' /> */}
      <Stack.Screen name='qr-scanner' />
      {/* <Stack.Screen name='share-profile' /> */}
    </Stack>
  )
}
