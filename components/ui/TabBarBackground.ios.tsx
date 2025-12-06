import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { StyleSheet, View } from 'react-native'

// Use a solid background so the color from `tabBarStyle.backgroundColor`
// is not overridden by the system (iOS light/dark mode).
export default function TabBarBackground() {
  return <View style={[StyleSheet.absoluteFill, styles.background]} />
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight()
}

const styles = StyleSheet.create({
  background: {
    // Keep in sync with `tabBarStyle.backgroundColor` in `app/(tabs)/_layout.tsx`
    backgroundColor: '#0c1424',
  },
})
