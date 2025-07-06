import { usePortfolio } from '@/hooks/usePortfolio'
import { useTransactions } from '@/hooks/useTransactions'
import React, { createContext, useContext } from 'react'

interface RefreshContextType {
  refetchPortfolio: () => void
  refetchTransactions: () => void
}

const RefreshContext = createContext<RefreshContextType>({
  refetchPortfolio: () => {},
  refetchTransactions: () => {},
})

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { refetch: refetchPortfolio } = usePortfolio()
  const { refetch: refetchTransactions } = useTransactions()

  // const refetchPortfolio = useCallback(() => {
  //   // Trigger portfolio refetch in background
  //   refetch().catch((error) => {
  //     console.error('Background portfolio refetch failed:', error)
  //   })
  // }, [refetch])

  return (
    <RefreshContext.Provider value={{ refetchPortfolio, refetchTransactions }}>
      {children}
    </RefreshContext.Provider>
  )
}

export const useRefetchContext = () => {
  const context = useContext(RefreshContext)
  if (!context) {
    throw new Error('useRefetch must be used within a RefreshProvider')
  }
  return context
}
