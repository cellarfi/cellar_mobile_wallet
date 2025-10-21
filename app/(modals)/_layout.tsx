import { Stack } from 'expo-router'

type ModalScreen = {
  name: string
  options?: {
    presentation?:
      | 'modal'
      | 'transparentModal'
      | 'containedModal'
      | 'containedTransparentModal'
      | 'fullScreenModal'
      | 'formSheet'
    headerShown?: boolean
  }
}

const modalScreens: ModalScreen[] = [
  { name: 'send' },
  { name: 'receive' },
  { name: 'buy-crypto' },
  { name: 'wallet-switcher' },
  { name: 'post-comments' },
  { name: 'qr-code' },
  { name: 'share-profile' },
  { name: 'manage-wallets' },
  { name: 'security-settings' },
  { name: 'notification-settings' },
  { name: 'qr-scanner' },
  { name: 'connect-wallet', options: { presentation: 'transparentModal' } },
  { name: 'sign-message', options: { presentation: 'transparentModal' } },
  { name: 'sign-transaction', options: { presentation: 'transparentModal' } },
  { name: 'points-history' },
  { name: 'launch-pumpfun' },
  { name: 'address-book' },
  { name: 'edit-address' },
  { name: 'create-post' },
  { name: 'create-comment' },
  { name: 'comment-thread' },
  { name: 'edit-profile' },
  { name: 'find-posts' },
  { name: 'hashtag-posts' },
  { name: 'tip-user' },
  { name: 'transaction-details' },
  { name: 'user-profile' },
]

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerShown: false,
        animation: 'slide_from_bottom',
      }}
    >
      {modalScreens.map((screen) => (
        <Stack.Screen
          key={screen.name}
          name={screen.name as any}
          options={screen.options}
        />
      ))}
    </Stack>
  )
}
