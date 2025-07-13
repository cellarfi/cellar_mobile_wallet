import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SecurityItemProps {
  icon: string;
  title: string;
  description: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
  isDanger?: boolean;
}

const SecurityItem = ({
  icon,
  title,
  description,
  hasSwitch = false,
  switchValue = false,
  onSwitchChange = () => {},
  onPress,
  isDanger = false,
}: SecurityItemProps) => (
  <TouchableOpacity
    className="flex-row items-center justify-between py-3 border-b border-dark-200"
    onPress={onPress}
    disabled={!onPress}
  >
    <View className="flex-row items-center flex-1">
      <View
        className={`w-10 h-10 bg-primary-500/10 rounded-full items-center justify-center mr-3 ${isDanger ? 'bg-red-500/10' : ''}`}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={isDanger ? '#ef4444' : '#3b82f6'}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-white font-medium ${isDanger ? 'text-red-400' : ''}`}
        >
          {title}
        </Text>
        <Text className="text-gray-400 text-xs mt-0.5">{description}</Text>
      </View>
    </View>
    {hasSwitch ? (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: '#334155', true: '#3b82f6' }}
        thumbColor="#fff"
      />
    ) : (
      <Ionicons name="chevron-forward" size={20} color="#64748b" />
    )}
  </TouchableOpacity>
);

export default function SecuritySettingsModal() {
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [autoLockTime, setAutoLockTime] = useState('1 minute');
  const [showAutoLockOptions, setShowAutoLockOptions] = useState(false);

  const handleAutoLockPress = () => {
    setShowAutoLockOptions(!showAutoLockOptions);
  };

  const handleAutoLockTimeSelect = (time: string) => {
    setAutoLockTime(time);
    setShowAutoLockOptions(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-dark-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-dark-200 rounded-full items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">
          Security Settings
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Authentication Section */}
        <View className="bg-dark-100 rounded-xl p-4 mb-4 border border-dark-200">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Authentication
          </Text>

          <SecurityItem
            icon="finger-print"
            title="Biometric Authentication"
            description="Use Face ID or Touch ID to unlock your wallet"
            hasSwitch
            switchValue={biometricEnabled}
            onSwitchChange={setBiometricEnabled}
          />
        </View>

        {/* Auto-Lock Section */}
        <View className="bg-dark-100 rounded-xl p-4 mb-4 border border-dark-200">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Auto-Lock
          </Text>

          <SecurityItem
            icon="time-outline"
            title="Auto Lock"
            description={`Lock wallet after ${autoLockEnabled ? autoLockTime : 'Never'}`}
            hasSwitch
            switchValue={autoLockEnabled}
            onSwitchChange={setAutoLockEnabled}
            onPress={handleAutoLockPress}
          />

          {showAutoLockOptions && (
            <View className="space-y-2">
              {[
                '30 seconds',
                '1 minute',
                '5 minutes',
                '30 minutes',
                '1 hour',
              ].map((time) => (
                <TouchableOpacity
                  key={time}
                  className={`flex-row items-center justify-between px-3 py-3 rounded-lg ${
                    autoLockTime === time ? 'bg-primary-500/10' : ''
                  }`}
                  onPress={() => handleAutoLockTimeSelect(time)}
                >
                  <Text
                    className={`text-base ${
                      autoLockTime === time
                        ? 'text-primary-500 font-semibold'
                        : 'text-white'
                    }`}
                  >
                    {time}
                  </Text>
                  {autoLockTime === time && (
                    <Ionicons name="checkmark" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Account Section */}
        <View className="bg-dark-100 rounded-xl p-4 mb-4 border border-dark-200">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Account
          </Text>

          <SecurityItem
            icon="key-outline"
            title="Change Password"
            description="Update your account password"
            onPress={() => {}}
          />
          <SecurityItem
            icon="mail-outline"
            title="Change Email"
            description="Update your email address"
            onPress={() => {}}
          />
          <SecurityItem
            icon="phone-portrait-outline"
            title="Change Phone Number"
            description="Update your phone number"
            onPress={() => {}}
          />
        </View>

        {/* Danger Zone */}
        <View className="border border-red-900/50 rounded-xl p-4 mb-4 bg-red-900/10">
          <Text className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Danger Zone
          </Text>

          <SecurityItem
            icon="log-out-outline"
            title="Log Out"
            description="Sign out of your account"
            isDanger
            onPress={() => {}}
          />
          <SecurityItem
            icon="trash-outline"
            title="Delete Account"
            description="Permanently delete your account and all data"
            isDanger
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
