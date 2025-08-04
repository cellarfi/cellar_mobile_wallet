import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface TabsProps<T extends string> {
  tabs: T[]
  activeTab: T
  onTabChange: (tab: T) => void
}

function Tabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: TabsProps<T>) {
  return (
    <View className="mb-4">
      <View className="flex-row bg-secondary-light  rounded-2xl p-1">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => onTabChange(tab)}
            className={`flex-1 py-3 rounded-xl ${
              activeTab === tab ? 'bg-secondary' : ''
            }`}
          >
            <Text
              className={`text-center font-medium capitalize ${
                activeTab === tab ? 'text-white' : 'text-gray-400'
              }`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default Tabs
