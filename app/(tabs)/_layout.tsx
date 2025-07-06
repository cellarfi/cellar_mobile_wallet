import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { View } from 'react-native'

import TabBarBackground from '@/components/ui/TabBarBackground'
import { useColorScheme } from '@/hooks/useColorScheme'

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#666672',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1E1E1E',
          borderTopColor: '#2d2d35',
          borderTopWidth: 1,
          height: 90,
          paddingBottom: 25,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarBackground: TabBarBackground,
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`p-1.5 rounded-lg ${
                focused ? 'bg-primary-500/20' : ''
              }`}
            >
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='wallet'
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`p-1.5 rounded-lg ${
                focused ? 'bg-primary-500/20' : ''
              }`}
            >
              <Ionicons
                name={focused ? 'wallet' : 'wallet-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='trading'
        options={{
          title: 'Trading',
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`p-1.5 rounded-lg ${
                focused ? 'bg-primary-500/20' : ''
              }`}
            >
              <Ionicons
                name={focused ? 'trending-up' : 'trending-up-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='social'
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`p-1.5 rounded-lg ${
                focused ? 'bg-primary-500/20' : ''
              }`}
            >
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`p-1.5 rounded-lg ${
                focused ? 'bg-primary-500/20' : ''
              }`}
            >
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  )
}
