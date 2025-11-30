import { Stack } from 'expo-router'

export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name='token-detail' />
      <Stack.Screen name='swap' />
      <Stack.Screen name='browser' />
      <Stack.Screen name='post-details' />
      <Stack.Screen name='nft-detail' />
      <Stack.Screen name='user-profile/[tag_name]' />
      <Stack.Screen name='search' />
    </Stack>
  )
}
