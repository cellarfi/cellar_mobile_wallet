import { AddressBookEntry } from '@/types'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AddressState {
  // Address data
  addresses: AddressBookEntry[]
  isLoading: boolean
  lastFetch: number | null
  error: string | null

  // Actions
  setAddresses: (addresses: AddressBookEntry[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearAddresses: () => void
  updateLastFetch: () => void
  addAddress: (address: AddressBookEntry) => void
  updateAddress: (addressId: string, updatedAddress: AddressBookEntry) => void
  removeAddress: (addressId: string) => void
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      // Initial state
      addresses: [],
      isLoading: false,
      lastFetch: null,
      error: null,

      // Actions
      setAddresses: (addresses) => {
        set({
          addresses,
          error: null,
          lastFetch: Date.now(),
        })
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      setError: (error) => {
        set({ error, isLoading: false })
      },

      clearAddresses: () => {
        set({
          addresses: [],
          error: null,
          lastFetch: null,
        })
      },

      updateLastFetch: () => {
        set({ lastFetch: Date.now() })
      },

      // Add a new address entry (optimistic update)
      addAddress: (address) => {
        set((state) => ({
          addresses: [...state.addresses, address],
          lastFetch: Date.now(),
        }))
      },

      // Update an existing address entry
      updateAddress: (addressId, updatedAddress) => {
        set((state) => ({
          addresses: state.addresses.map((address) =>
            address.id === addressId
              ? { ...address, ...updatedAddress }
              : address
          ),
          lastFetch: Date.now(),
        }))
      },

      // Remove an address entry
      removeAddress: (addressId) => {
        set((state) => ({
          addresses: state.addresses.filter(
            (address) => address.id !== addressId
          ),
          lastFetch: Date.now(),
        }))
      },
    }),
    {
      name: 'address-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist address data and last fetch time for offline support
      partialize: (state) => ({
        addresses: state.addresses,
        lastFetch: state.lastFetch,
      }),
    }
  )
)
