import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  // Main Tabs
  '(tabs)': NavigatorScreenParams<TabParamList>;
  
  // Modals
  '(modals)': NavigatorScreenParams<ModalStackParamList>;
  
  // Auth
  '(auth)': NavigatorScreenParams<AuthStackParamList>;
  'login': undefined;
  'register': undefined;
  'forgot-password': undefined;
  'reset-password': { token: string };
  'onboarding': undefined;
  'setup-profile': undefined;
  'welcome': undefined;
  'home': undefined;
  'profile': undefined;
  'settings': undefined;
  'wallet': undefined;
  'notifications': undefined;
  'search': undefined;
  'discover': undefined;
  'messages': undefined;
  'create-post': undefined;
  'edit-profile': undefined;
  'change-password': undefined;
  'privacy': undefined;
  'help': undefined;
  'about': undefined;
  'terms': undefined;
  'privacy-policy': undefined;
  'cookies': undefined;
  'licenses': undefined;
};

export type TabParamList = {
  home: undefined;
  wallet: undefined;
  discover: undefined;
  messages: undefined;
  profile: undefined;
};

export type ModalStackParamList = {
  'token-detail': { tokenId: string };
  'send': { assetId?: string; address?: string };
  'receive': { assetId?: string };
  'swap': undefined;
  'buy-crypto': undefined;
  'nft-detail': { nftId: string };
  'wallet-switcher': undefined;
  'post-comments': { postId: string };
  'qr-code': undefined;
  'share-profile': undefined;
  'manage-wallets': undefined;
  'security-settings': undefined;
  'notification-settings': undefined;
  'qr-scanner': { onScan: (data: string) => void };
  'browser': { url: string };
};

export type AuthStackParamList = {
  'login': undefined;
  'register': undefined;
  'forgot-password': undefined;
  'reset-password': { token: string };
  'onboarding': undefined;
  'setup-profile': undefined;
};

// This allows type checking for the router object
declare global {
  namespace ReactNavigation {
    // Use RootStackParamList directly instead of extending
    type RootParamList = RootStackParamList;
  }
}
