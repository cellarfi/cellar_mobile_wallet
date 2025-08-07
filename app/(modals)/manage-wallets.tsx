import { toTitleCase } from '@/libs/string.helpers';
import { useAuthStore } from '@/store/authStore';
import { PrivyWalletAccount } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const getWalletIcon = (type: string) => {
  switch (type) {
    case 'solana':
      return 'wallet' as const;
    case 'ethereum':
      return 'wallet' as const;
    case 'bitcoin':
      return 'wallet' as const;
    default:
      return 'wallet-outline' as const;
  }
};

const { activeWallet } = useAuthStore.getState();

const isActiveWallet = (wallet: PrivyWalletAccount) => {
  return wallet.address === activeWallet?.address;
};

// Helper to get wallet display name
const getWalletName = (wallet: PrivyWalletAccount) => {
  return `${toTitleCase(wallet.chain_type)} Wallet`;
};

const handleSetActive = (wallet: PrivyWalletAccount) => {
  useAuthStore.getState().setActiveWallet(wallet);
};

export default function ManageWalletsModal() {
  const { wallets } = useAuthStore();

  if ((!wallets || wallets.length === 0) && activeWallet) {
    wallets.push(activeWallet);
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-dark-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-dark-200 rounded-full items-center justify-center"
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Manage Wallets</Text>
        <View className="w-10" />
      </View>

      {/* Wallets List */}
      <ScrollView className="flex-1 p-4">
        {wallets.map((wallet) => (
          <TouchableOpacity
            key={wallet.address}
            className={`flex-row items-center justify-between p-4 mb-3 rounded-xl ${
              isActiveWallet(wallet)
                ? 'border border-primary-500 bg-primary-500/10'
                : 'bg-dark-100'
            }`}
            onPress={() => handleSetActive(wallet)}
          >
            <View className="flex-row items-center flex-1">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  isActiveWallet(wallet) ? 'bg-primary-500/20' : 'bg-dark-200'
                }`}
              >
                <Ionicons
                  name={getWalletIcon(wallet.type)}
                  size={20}
                  color={isActiveWallet(wallet) ? '#3b82f6' : '#94a3b8'}
                />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-base font-medium ${
                    isActiveWallet(wallet) ? 'text-primary-500' : 'text-white'
                  }`}
                >
                  {getWalletName(wallet)}
                </Text>
                <Text
                  className={`text-xs font-mono ${
                    isActiveWallet(wallet)
                      ? 'text-primary-400'
                      : 'text-gray-400'
                  }`}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {wallet.address}
                </Text>
              </View>
            </View>

            {isActiveWallet(wallet) && (
              <View className="ml-2">
                <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Add New Wallet Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center py-4 border-2 border-dashed border-primary-500 rounded-xl mt-2"
          onPress={() => console.log('Add new wallet')}
        >
          <Ionicons name="add" size={24} color="#3b82f6" />
          <Text className="text-primary-500 font-semibold ml-2">
            Add New Wallet
          </Text>
        </TouchableOpacity>

        {/* Wallet Actions */}
        <View className="mt-8">
          <Text className="text-gray-400 text-sm font-medium mb-3 px-1">
            Wallet Actions
          </Text>

          <View className="bg-dark-100 rounded-xl overflow-hidden">
            {[
              { icon: 'key-outline', label: 'View Private Key' },
              { icon: 'download-outline', label: 'Export Wallet' },
              { icon: 'copy-outline', label: 'Copy Address' },
              {
                icon: 'trash-outline',
                label: 'Remove Wallet',
                textClass: 'text-red-500',
              },
            ].map((action, index) => (
              <TouchableOpacity
                key={action.label}
                className={`flex-row items-center px-4 py-4 ${
                  index > 0 ? 'border-t border-dark-200' : ''
                }`}
                onPress={() => console.log(action.label)}
              >
                <Ionicons
                  name={action.icon as any}
                  size={20}
                  color={
                    action.textClass?.includes('red') ? '#ef4444' : '#94a3b8'
                  }
                />
                <Text
                  className={`ml-3 text-sm font-medium ${
                    action.textClass || 'text-white'
                  }`}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
