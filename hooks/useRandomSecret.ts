import { useMemo } from 'react'

import { getRandomBytes } from 'expo-crypto'

export const useRandomSecret = () => {
  return useMemo(() => {
    const secretBuffer = getRandomBytes(32)

    return Array.from(secretBuffer)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }, [])
}
