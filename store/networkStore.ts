import NetInfo from '@react-native-community/netinfo'
import { create } from 'zustand'

interface NetworkState {
  isOnline: boolean | null
  connectionType: string | null
  isInternetReachable: boolean | null

  // Actions
  setNetworkState: (state: {
    isOnline: boolean | null
    connectionType: string | null
    isInternetReachable: boolean | null
  }) => void

  // Initialize network monitoring
  initialize: () => () => void
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: null,
  connectionType: null,
  isInternetReachable: null,

  setNetworkState: (networkState) => {
    set(networkState)
  },

  initialize: () => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      console.log('Network state changed:', {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      })

      set({
        isOnline: state.isConnected,
        connectionType: state.type,
        isInternetReachable: state.isInternetReachable,
      })
    })

    // Get initial network state
    NetInfo.fetch().then((state) => {
      set({
        isOnline: state.isConnected,
        connectionType: state.type,
        isInternetReachable: state.isInternetReachable,
      })
    })

    return unsubscribe
  },
}))
