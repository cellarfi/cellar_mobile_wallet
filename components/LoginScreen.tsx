import { LoginWithOAuthInput, useLoginWithOAuth } from '@privy-io/expo'
import { useLoginWithPasskey } from '@privy-io/expo/passkey'
import { useLogin } from '@privy-io/expo/ui'
import * as Application from 'expo-application'
import Constants from 'expo-constants'
import { useState } from 'react'
import { Button, Linking, Text, View } from 'react-native'

export default function LoginScreen() {
  const [error, setError] = useState('')
  const { loginWithPasskey } = useLoginWithPasskey({
    onError: (err) => {
      console.log(err)
      setError(JSON.stringify(err.message))
    },
  })
  const { login } = useLogin()
  const oauth = useLoginWithOAuth({
    onError: (err) => {
      console.log(err)
      setError(JSON.stringify(err.message))
    },
  })
  return (
    <View className=' flex-1 items-center justify-center gap-10'>
      <Text>Privy App ID:</Text>
      <Text style={{ fontSize: 10 }}>
        {Constants.expoConfig?.extra?.privyAppId}
      </Text>
      <Text>Privy Client ID:</Text>
      <Text style={{ fontSize: 10 }}>
        {Constants.expoConfig?.extra?.privyClientId}
      </Text>
      <Text>
        Navigate to your{' '}
        <Text
          onPress={() =>
            Linking.openURL(
              `https://dashboard.privy.io/apps/${Constants.expoConfig?.extra?.privyAppId}/settings?setting=clients`
            )
          }
        >
          dashboard
        </Text>{' '}
        and ensure the following Expo Application ID is listed as an `Allowed
        app identifier`:
      </Text>
      <Text style={{ fontSize: 10 }}>{Application.applicationId}</Text>
      <Text>
        Navigate to your{' '}
        <Text
          onPress={() =>
            Linking.openURL(
              `https://dashboard.privy.io/apps/${Constants.expoConfig?.extra?.privyAppId}/settings?setting=clients`
            )
          }
        >
          dashboard
        </Text>{' '}
        and ensure the following value is listed as an `Allowed app URL scheme`:
      </Text>
      <Text style={{ fontSize: 10 }}>
        {Application.applicationId === 'host.exp.Exponent'
          ? 'exp'
          : Constants.expoConfig?.scheme}
      </Text>

      <Button
        title='Login with Privy UIs'
        onPress={() => {
          login({
            loginMethods: ['email'],
            appearance: { logo: 'https://www.pixawallet.live/meta.png' },
          })
            .then((session) => {
              console.log('User logged in', session.user)
            })
            .catch((err) => {
              setError(JSON.stringify(err.error) as string)
            })
        }}
      />

      <Button
        title='Login using Passkey'
        onPress={() =>
          loginWithPasskey({
            relyingParty: Constants.expoConfig?.extra?.passkeyAssociatedDomain,
          })
        }
      />

      <View
        style={{ display: 'flex', flexDirection: 'column', gap: 5, margin: 10 }}
      >
        {['github', 'google', 'discord', 'apple'].map((provider) => (
          <View key={provider}>
            <Button
              title={`Login with ${provider}`}
              disabled={oauth.state.status === 'loading'}
              onPress={() => oauth.login({ provider } as LoginWithOAuthInput)}
            ></Button>
          </View>
        ))}
      </View>
      {error && <Text style={{ color: 'red' }}>Error: {error}</Text>}
    </View>
  )
}
