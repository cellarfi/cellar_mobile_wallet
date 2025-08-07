import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

interface NotificationItemProps {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  hasChevron?: boolean;
  onPress?: () => void;
}

const NotificationItem = ({
  icon,
  title,
  description,
  value,
  onValueChange,
  hasChevron = false,
  onPress,
}: NotificationItemProps) => (
  <TouchableOpacity 
    className="flex-row items-center justify-between p-4 border-b border-dark-200"
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View className="flex-row items-center flex-1">
      <View className="w-10 h-10 bg-primary-500/10 rounded-full items-center justify-center mr-3">
        <Ionicons name={icon as any} size={20} color="#3b82f6" />
      </View>
      <View className="flex-1">
        <Text className="text-white font-medium">{title}</Text>
        <Text className="text-gray-400 text-xs mt-0.5">{description}</Text>
      </View>
    </View>
    {hasChevron ? (
      <Ionicons name="chevron-forward" size={20} color="#64748b" />
    ) : (
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#334155", true: "#3b82f6" }}
        thumbColor="#ffffff"
      />
    )}
  </TouchableOpacity>
);

const NotificationSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View className="bg-dark-100 rounded-xl p-4 mb-4 border border-dark-200">
    <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
      {title}
    </Text>
    <View className="flex-1">
      {children}
    </View>
  </View>
);

export default function NotificationSettingsModal() {
  // Notification toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  
  // Notification types
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [newsUpdates, setNewsUpdates] = useState(true);
  const [nftActivity, setNftActivity] = useState(true);
  const [stakingRewards, setStakingRewards] = useState(true);
  const [governanceVotes, setGovernanceVotes] = useState(false);
  
  // Notification preferences
  const [snoozeEnabled, setSnoozeEnabled] = useState(false);
  const [snoozeUntil, setSnoozeUntil] = useState("");
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietHoursFrom, setQuietHoursFrom] = useState("10:00 PM");
  const [quietHoursTo, setQuietHoursTo] = useState("7:00 AM");
  const [priorityOnly, setPriorityOnly] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <View className="flex-row items-center justify-between p-4 border-b border-dark-200">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 bg-dark-200 rounded-full items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Notification Settings</Text>
        <View className="w-10" />
      </View>
      
      <ScrollView className="flex-1 p-4">
        <NotificationSection title="Notification Methods">
          <NotificationItem
            icon="notifications-outline"
            title="Push Notifications"
            description="Receive push notifications on this device"
            value={pushEnabled}
            onValueChange={setPushEnabled}
          />
          <NotificationItem
            icon="mail-outline"
            title="Email Notifications"
            description="Receive notifications via email"
            value={emailEnabled}
            onValueChange={setEmailEnabled}
          />
          <NotificationItem
            icon="phone-portrait-outline"
            title="SMS Notifications"
            description="Receive notifications via text message"
            value={smsEnabled}
            onValueChange={setSmsEnabled}
          />
        </NotificationSection>
        
        <NotificationSection title="Notification Types">
          <NotificationItem
            icon="pulse-outline"
            title="Price Alerts"
            description="Price movement alerts for your watchlist"
            value={priceAlerts}
            onValueChange={setPriceAlerts}
          />
          <NotificationItem
            icon="swap-horizontal-outline"
            title="Transaction Alerts"
            description="Notifications for sent and received transactions"
            value={transactionAlerts}
            onValueChange={setTransactionAlerts}
          />
          <NotificationItem
            icon="shield-checkmark-outline"
            title="Security Alerts"
            description="Important security notifications"
            value={securityAlerts}
            onValueChange={setSecurityAlerts}
          />
          <NotificationItem
            icon="gift-outline"
            title="Promotions"
            description="Special offers and promotions"
            value={promotions}
            onValueChange={setPromotions}
          />
          <NotificationItem
            icon="newspaper-outline"
            title="News & Updates"
            description="Latest news and updates from Cellar"
            value={newsUpdates}
            onValueChange={setNewsUpdates}
          />
          <NotificationItem
            icon="image-outline"
            title="NFT Activity"
            description="Notifications about your NFT collection"
            value={nftActivity}
            onValueChange={setNftActivity}
          />
          <NotificationItem
            icon="trending-up-outline"
            title="Staking Rewards"
            description="Updates on your staking rewards"
            value={stakingRewards}
            onValueChange={setStakingRewards}
          />
          <NotificationItem
            icon="megaphone-outline"
            title="Governance Votes"
            description="Updates on governance proposals"
            value={governanceVotes}
            onValueChange={setGovernanceVotes}
          />
        </NotificationSection>
        
        <NotificationSection title="Notification Preferences">
          <NotificationItem
            icon="moon-outline"
            title="Quiet Hours"
            description={`${quietHoursFrom} - ${quietHoursTo}`}
            value={quietHoursEnabled}
            onValueChange={setQuietHoursEnabled}
            hasChevron
            onPress={() => {}}
          />
          <NotificationItem
            icon="alarm-outline"
            title="Snooze Notifications"
            description={snoozeEnabled ? `Snoozed until ${snoozeUntil}` : "Off"}
            value={snoozeEnabled}
            onValueChange={setSnoozeEnabled}
            hasChevron
            onPress={() => {}}
          />
          <NotificationItem
            icon="star-outline"
            title="Priority Only Mode"
            description="Only show high priority notifications"
            value={priorityOnly}
            onValueChange={setPriorityOnly}
          />
        </NotificationSection>
        
        <View className="p-4">
          <Text className="text-gray-400 text-xs text-center">
            Adjust your notification preferences to control how and when you receive updates from Cellar.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
