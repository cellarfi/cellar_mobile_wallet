import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { BlurView } from 'expo-blur'
import { Platform, StyleSheet } from 'react-native'

export default function BlurTabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        // System chrome material automatically adapts to the system's theme
        // and matches the native tab bar appearance on iOS.
        tint='systemChromeMaterial'
        intensity={100}
        style={StyleSheet.absoluteFill}
      />
    )
  }

  // Android fallback - semi-transparent background
  // return (
  //   <View
  //     style={[
  //       StyleSheet.absoluteFill,
  //       {
  //         backgroundColor: 'rgba(255, 255, 255, 0.85)', // Slightly more opaque for Android
  //         backdropFilter: 'blur(10px)', // CSS fallback for web
  //       },
  //     ]}
  //   />
  // )
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight()
}
