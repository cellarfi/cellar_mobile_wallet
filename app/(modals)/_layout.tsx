import { Stack } from 'expo-router';

type ModalScreen = {
  name: string;
  options?: {
    presentation?: 'modal' | 'transparentModal' | 'containedModal' | 'containedTransparentModal' | 'fullScreenModal' | 'formSheet';
    headerShown?: boolean;
  };
};

const modalScreens: ModalScreen[] = [
  { name: 'token-detail' },
  { name: 'send' },
  { name: 'receive' },
  { name: 'swap' },
  { name: 'buy-crypto' },
  { name: 'nft-detail' },
  { name: 'wallet-switcher' },
  { name: 'post-comments' },
  { name: 'qr-code' },
  { name: 'share-profile' },
  { name: 'manage-wallets' },
  { name: 'security-settings' },
  { name: 'notification-settings' },
  { name: 'qr-scanner' },
  { name: 'browser' },
  { name: 'points-history' },
  { name: 'user-profile/[tag_name]' },
];

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: "modal",
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
  );
}
