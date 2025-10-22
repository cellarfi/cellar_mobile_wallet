import { useAuthStore } from '@/store/authStore'
import { Redirect } from 'expo-router'
import React from 'react'

export default function ProfileScreen() {
  const { profile } = useAuthStore()

  if (!profile) {
    return <Redirect href='/setup-profile' />
  }

  // Redirect to dynamic profile route with current user's tag_name
  return <Redirect href={`/profile/${profile.tag_name}`} />
}
