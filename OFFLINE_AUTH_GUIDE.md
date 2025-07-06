# Offline Authentication System

This project implements a robust offline-first authentication system using **Zustand** with **AsyncStorage** persistence. The app works seamlessly both online and offline.

## How It Works

### 1. Zustand Store with Persistence (`/store/authStore.ts`)

The authentication state is stored in a Zustand store that automatically persists to AsyncStorage:

```typescript
const { user, isAuthenticated, isReady } = useAuthStore()
```

**Key Features:**
- Persists user data locally using AsyncStorage
- Works offline - cached authentication state is available immediately
- Syncs with Privy when online
- 24-hour cache expiration (configurable)

### 2. Privy Sync Hook (`/hooks/usePrivySync.ts`)

This hook keeps Privy in sync with our local store:

```typescript
usePrivySync() // Call this at the root level
```

**What it does:**
- Monitors Privy authentication state changes
- Updates Zustand store when Privy state changes
- Preserves offline state when Privy is unavailable
- Handles logout from both systems

### 3. Network Monitoring (`/store/networkStore.ts`)

Tracks connectivity status:

```typescript
const { isOnline, isOffline } = useNetworkStore()
```

### 4. Combined Hook (`/hooks/useAppState.ts`)

Provides unified access to authentication and network state:

```typescript
const { 
  user, 
  isAuthenticated, 
  isOffline, 
  isLoading,
  logout,
  getStatusText 
} = useAppState()
```

## Usage Examples

### Basic Authentication Check

```typescript
import { useAppState } from '@/hooks/useAppState'

function MyComponent() {
  const { user, isAuthenticated, isOffline } = useAppState()
  
  if (!isAuthenticated) {
    return <LoginPrompt />
  }
  
  return (
    <View>
      <Text>Welcome, {user?.id}!</Text>
      {isOffline && <Text>You're offline</Text>}
    </View>
  )
}
```

### Show Offline Status

```typescript
import OfflineStatusBanner from '@/components/OfflineStatusBanner'

function MyScreen() {
  return (
    <View>
      <OfflineStatusBanner />
      {/* Your content */}
    </View>
  )
}
```

### Navigation with Auth

```typescript
// In any screen
const { isAuthenticated, isLoading } = useAppState()

useEffect(() => {
  if (!isLoading) {
    if (isAuthenticated) {
      router.replace('/(tabs)')
    } else {
      router.replace('/(auth)/login')
    }
  }
}, [isAuthenticated, isLoading])
```

## Key Benefits

### ✅ Offline-First
- App works even when completely offline
- User data cached locally and persists between app sessions
- No authentication delays on app startup

### ✅ Seamless Sync
- Automatically syncs with Privy when online
- Handles conflicts gracefully
- Preserves user session across network changes

### ✅ Performance
- Instant authentication checks
- No network calls required for auth state
- Cached data available immediately

### ✅ Reliability
- Works in poor network conditions
- Graceful fallback to cached data
- No authentication failures due to network issues

## Architecture Flow

```
1. App Starts
   ↓
2. Zustand loads cached auth state from AsyncStorage
   ↓
3. User sees app immediately (offline or online)
   ↓
4. If online: Privy loads and syncs with Zustand
   ↓
5. Both systems stay in sync
```

## Configuration

### Cache Duration
Change in `/store/authStore.ts`:
```typescript
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
```

### Storage Key
Modify in `/store/authStore.ts`:
```typescript
name: 'auth-storage' // AsyncStorage key
```

## Testing Offline Mode

1. **iOS Simulator:** Hardware → Network Link Conditioner → 100% Loss
2. **Android Emulator:** Settings → Network & Internet → Turn off WiFi/Mobile
3. **Device:** Enable Airplane mode

The app should continue working with cached authentication data.

## Troubleshooting

### User not staying logged in
- Check if `usePrivySync()` is called in root component
- Verify AsyncStorage permissions
- Check console for persistence errors

### Network status not updating
- Ensure `useNetworkStore().initialize()` is called in root
- Check `@react-native-community/netinfo` installation

### Authentication conflicts
- Clear app storage/cache
- Check logs for sync conflicts
- Verify Privy configuration

## Dependencies

```json
{
  "zustand": "^4.x.x",
  "@react-native-async-storage/async-storage": "^1.x.x",
  "@react-native-community/netinfo": "^11.x.x",
  "@privy-io/expo": "^0.x.x"
}
```

This system provides a robust foundation for offline-first authentication in React Native apps! 