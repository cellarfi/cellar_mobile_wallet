# Biometric Authentication Feature

## Overview

This document describes the biometric authentication feature implemented for the Cellar mobile app. The feature provides secure wallet access using Face ID (iOS) and Fingerprint/Biometric authentication (Android) with a PIN backup option.

## Features

### 1. **Biometric Authentication**
- **iOS**: Face ID support
- **Android**: Fingerprint, Iris, and Face Recognition support
- Automatic detection of available biometric hardware
- User-friendly error messages for unsupported devices

### 2. **PIN Backup**
- 4-digit PIN as a fallback authentication method
- PIN is securely hashed using SHA-256 before storage
- PIN confirmation during setup to prevent typos

### 3. **App Lock/Unlock**
- Automatically locks the app on startup if biometric is enabled
- Locks when app goes to background based on auto-lock settings
- Shows biometric lock screen when app is reopened or started
- Option to use PIN if biometric fails or is unavailable

### 4. **Auto-Lock Configuration**
- **Immediate** (default) - Lock as soon as app goes to background
- **1 minute** - Lock after 1 minute in background
- **3 minutes** - Lock after 3 minutes in background
- **5 minutes** - Lock after 5 minutes in background
- **Custom** - Set any custom time (in minutes)
- Beautiful radio button UI for easy selection
- Always-visible options (no hidden dropdown)

### 5. **Smart Onboarding**
- Prompts new users to enable biometric after email verification
- Users can skip the setup
- Periodic reminders for users who haven't enabled biometric yet

### 6. **Periodic Prompts**
- Reminds users to enable biometric authentication at smart intervals:
  - Every 7 days for first 2 skips
  - Every 14 days after that
  - Stops prompting after 3 skips
  - Never prompts if already set up

## Architecture

### Files Created/Modified

#### New Files
1. **`libs/biometric.lib.ts`** - Core biometric utility functions
   - `checkBiometricCapabilities()` - Detect device capabilities
   - `authenticateWithBiometrics()` - Perform biometric authentication
   - `hashPin()` / `verifyPin()` - PIN security functions
   - `lockApp()` / `unlockApp()` - App lock state management
   - `shouldShowBiometricPrompt()` - Smart prompt logic

2. **`components/ui/PinInput.tsx`** - Reusable PIN input component
   - 4-digit PIN entry with dot indicators
   - Shake animation on error
   - Success/error states
   - Follows app design theme

3. **`app/(modals)/setup-biometric.tsx`** - Setup wizard modal
   - Multi-step onboarding flow (intro → PIN setup → PIN confirm → test → complete)
   - Biometric capability detection
   - Test authentication before enabling
   - Beautiful UI following app theme

4. **`components/BiometricLockScreen.tsx`** - Lock screen component
   - Shows when app is locked
   - Biometric authentication or PIN entry
   - Failed attempt tracking (max 5 attempts)
   - Fallback between biometric and PIN

#### Modified Files
1. **`store/settingsStore.ts`** - Added biometric and auto-lock settings:
   ```typescript
   biometricSetupCompleted: boolean
   biometricPinHash: string | null
   lastBiometricPromptDate: number | null
   biometricPromptSkipCount: number
   autoLockEnabled: boolean
   autoLockTimeout: number // in milliseconds (0 = immediate)
   ```

2. **`constants/App.ts`** - Added secure storage keys:
   ```typescript
   BIOMETRIC_ENABLED: 'biometric_enabled'
   APP_LOCKED: 'app_locked'
   ```

3. **`contexts/AuthProvider.tsx`** - Added lock/unlock logic:
   - App state monitoring
   - Automatic locking on app mount if biometric enabled
   - Auto-lock on background with configurable timeout
   - Periodic prompt checking
   - Lock screen overlay management

4. **`contexts/Providers.tsx`** - Added BiometricLockScreen overlay
   - Shows lock screen modal when `appIsLocked` is true
   - Full-screen modal with fade animation

5. **`app/(auth)/verify-email.tsx`** - Added post-login biometric prompt
   - Checks if biometric should be shown after successful verification
   - Navigates to setup modal if appropriate

6. **`app/(modals)/security-settings.tsx`** - Connected to real biometric functionality
   - Toggle biometric on/off
   - Shows device-specific biometric type name
   - Navigates to setup flow if not configured
   - Radio button UI for auto-lock selection (Immediate, 1min, 3min, 5min, Custom)
   - Custom time input for flexible lock durations
   - Visual indicator showing currently selected option

7. **`app.json`** - Added biometric plugin and iOS permissions
   ```json
   {
     "plugins": ["expo-local-authentication"],
     "ios": {
       "infoPlist": {
         "NSFaceIDUsageDescription": "We use Face ID to securely unlock your wallet and protect your assets."
       }
     }
   }
   ```

## User Flow

### First-Time Setup

1. **Login** - User completes email verification
2. **Prompt** - System checks if biometric is available and should prompt
3. **Introduction** - Shows benefits of biometric authentication
4. **PIN Setup** - User creates a 4-digit PIN
5. **PIN Confirmation** - User confirms the PIN
6. **Test** - System tests biometric authentication
7. **Complete** - Biometric is enabled

Users can skip at any step, and the system will remember to prompt them again later.

### Daily Usage

1. **App Started** - If biometric is enabled, lock screen appears immediately
2. **Authentication** - User unlocks with Face ID/Fingerprint or PIN
3. **Access Granted** - App unlocks and user continues
4. **App Minimized** - App locks based on auto-lock setting (default: immediate)
5. **App Reopened** - Lock screen appears again

### Settings Management

1. Navigate to **Settings → Security Settings**
2. Toggle **Biometric Authentication** on/off
   - If toggling on and not set up, navigate to setup flow
   - If disabling, show confirmation dialog
3. Configure **Auto Lock Timeout**
   - Radio button selection (always visible)
   - Options: Immediate (default), 1 min, 3 min, 5 min, Custom
   - Custom option allows entering any duration in minutes
   - Selected option is highlighted with secondary color
   - Current selection shown at the top of the section

## Security Considerations

1. **PIN Hashing** - PINs are hashed using SHA-256 before storage
2. **Secure Storage** - Sensitive data stored using `expo-secure-store`
3. **Failed Attempts** - Lock screen limits to 5 failed PIN attempts
4. **No Data Leakage** - Biometric data never leaves the device
5. **User Control** - Users can always disable biometric authentication

## Configuration

### Prompt Intervals

The system uses smart intervals to avoid being annoying:

```typescript
// In biometric.lib.ts
const promptInterval = skipCount < 2 ? 7 : 14 // days
const maxSkips = 3
```

You can adjust these values in `libs/biometric.lib.ts` → `shouldShowBiometricPrompt()`.

### PIN Length

Currently set to 4 digits. To change:

```typescript
// In PinInput.tsx and BiometricLockScreen.tsx
<PinInput length={4} />  // Change to desired length
```

## Testing

### Test Scenarios

1. **Device Without Biometric**
   - Should show appropriate message
   - Should not show setup prompts
   - Should not show biometric toggle in settings

2. **Device With Biometric - Not Enrolled**
   - Should detect hardware
   - Should show message to set up in device settings
   - Should not allow enabling

3. **Device With Biometric - Enrolled**
   - Should detect capability correctly
   - Should show setup flow
   - Should authenticate successfully
   - Should lock/unlock properly

4. **PIN Fallback**
   - Should work when biometric fails
   - Should verify PIN correctly
   - Should limit failed attempts
   - Should allow switching between biometric and PIN

5. **Skip Behavior**
   - Should track skip count
   - Should respect prompt intervals
   - Should stop prompting after max skips

## Dependencies

- **expo-local-authentication** - Biometric authentication
- **expo-secure-store** - Secure storage for sensitive data
- **expo-crypto** - PIN hashing
- **@expo/vector-icons** - Icons (already in project)
- **react-native** - Core components

## Platform-Specific Notes

### iOS
- Requires `NSFaceIDUsageDescription` in Info.plist (added to app.json)
- Supports Face ID and Touch ID
- Requires physical device for testing (simulator doesn't support biometrics)

### Android
- Supports Fingerprint, Iris, and Face Recognition
- Different manufacturers may have different implementations
- Testing can be done on emulator with enrolled fingerprint

## Troubleshooting

### Biometric Not Working

1. Check device capabilities:
   ```typescript
   const caps = await checkBiometricCapabilities()
   console.log(caps)
   ```

2. Verify biometric is enrolled on device
3. Check app permissions
4. Ensure expo-local-authentication is properly installed

### App Not Locking

1. Check `enableBiometricAuth` in settings store
2. Verify `lockApp()` is being called
3. Check AppState listener is working
4. Look for errors in console

### PIN Not Working

1. Verify PIN was set up correctly
2. Check `biometricPinHash` exists in settings
3. Test PIN hashing: `hashPin('1234')` should be consistent
4. Check for failed attempt limit

## Future Enhancements

Potential improvements:

1. ~~**Auto-lock Timer**~~ - ✅ **IMPLEMENTED** - Lock after X minutes of inactivity
2. **Biometric for Transactions** - Require biometric for sending funds
3. **Multiple PINs** - Different PINs for different security levels
4. **Backup Codes** - Recovery codes if PIN is forgotten
5. **Analytics** - Track biometric usage and failure rates

## Support

For issues or questions:
1. Check this documentation
2. Review code comments in `libs/biometric.lib.ts`
3. Test on physical device (biometrics don't work in simulator)
4. Check expo-local-authentication documentation

## Design Philosophy

This implementation follows these principles:

1. **Security First** - Strong encryption, no data leakage
2. **User-Friendly** - Clear messaging, easy setup
3. **Non-Intrusive** - Smart prompting, easy to skip
4. **Graceful Degradation** - PIN fallback, works without biometric
5. **Platform-Appropriate** - Uses native platform features
6. **Follows App Theme** - Consistent design with existing UI

---

**Last Updated**: 2025-10-30
**Version**: 1.1.0

## Changelog

### v1.1.0 (2025-10-30)
- ✅ Fixed: App now locks on startup when biometric is enabled
- ✅ Added: Auto-lock functionality with configurable timeout
- ✅ Added: "Immediate" as default auto-lock option
- ✅ Added: Radio button UI for auto-lock selection (Immediate, 1min, 3min, 5min)
- ✅ Added: Custom time input option for flexible durations
- ✅ Improved: Always-visible auto-lock options (no dropdown/toggle needed)
- ✅ Improved: Visual feedback for selected option with secondary color

### v1.0.0 (2025-10-30)
- Initial release with biometric authentication and PIN backup

