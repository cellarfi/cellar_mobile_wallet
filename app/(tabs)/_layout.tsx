import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { View } from 'react-native'

import TabBarBackground from '@/components/ui/TabBarBackground'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        // tabBarActiveTintColor: '#6366f1',
        tabBarActiveTintColor: Colors.dark.secondary,
        tabBarInactiveTintColor: '#666672',
        headerShown: false,
        tabBarStyle: {
          // backgroundColor: '#1E1E1E',
          // backgroundColor: Colors.dark.secondaryLight,
          backgroundColor: '#0c1424',
          // borderTopColor: '#2d2d35',
          borderTopColor: Colors.dark.secondary,
          borderTopWidth: 0,
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
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`p-1.5 rounded-lg ${
                focused ? 'bg-primary-500/20' : ''
              }`}
            >
              <Ionicons
                name={focused ? 'telescope' : 'telescope-outline'}
                // name={focused ? 'trending-up' : 'trending-up-outline'}
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
        name='explore'
        options={{
          title: 'Browse',
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`p-1.5 rounded-lg ${
                focused ? 'bg-primary-500/20' : ''
              }`}
            >
              <Ionicons
                name={focused ? 'compass' : 'compass-outline'}
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
