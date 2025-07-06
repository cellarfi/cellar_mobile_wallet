import { addressBookRequests } from '@/libs/api_requests/address-book.request'
import { AddressBookEntry } from '@/types'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AddressBookState {
  // State
  entries: AddressBookEntry[]
  isLoading: boolean
  lastRefresh: number | null

  // Actions
  loadAddressBook: (force?: boolean) => Promise<void>
  addEntry: (entry: AddressBookEntry) => void
  updateEntry: (entryId: string, entry: AddressBookEntry) => void
  removeEntry: (entryId: string) => void
  setEntries: (entries: AddressBookEntry[]) => void
  shouldRefresh: () => boolean
}

const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes in milliseconds

export const useAddressBookStore = create<AddressBookState>()(
  persist(
    (set, get) => ({
      // Initial state
      entries: [],
      isLoading: false,
      lastRefresh: null,

      // Check if we should refresh based on last refresh time
      shouldRefresh: () => {
        const { lastRefresh } = get()
        if (!lastRefresh) return true
        return Date.now() - lastRefresh > REFRESH_INTERVAL
      },

      // Load address book from API
      loadAddressBook: async (force = false) => {
        // Skip if already loading or recently refreshed (unless force=true)
        if (get().isLoading || (!force && !get().shouldRefresh())) return

        set({ isLoading: true })
        try {
          console.log(
            'Loading address book from API',
            force ? '(forced refresh)' : ''
          )
          const response = await addressBookRequests.getAddressBook()
          if (response.success && response.data) {
            set({
              entries: response.data,
              lastRefresh: Date.now(),
            })
          }
        } catch (error) {
          console.error('Error loading address book from store:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      // Add a new entry to the store (optimistic update)
      addEntry: (entry: AddressBookEntry) => {
        set((state) => ({
          entries: [...state.entries, entry],
          lastRefresh: Date.now(), // Update timestamp to avoid immediate refetch
        }))
      },

      // Update an existing entry
      updateEntry: (entryId: string, updatedEntry: AddressBookEntry) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId ? { ...entry, ...updatedEntry } : entry
          ),
          lastRefresh: Date.now(), // Update timestamp to avoid immediate refetch
        }))
      },

      // Remove an entry
      removeEntry: (entryId: string) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== entryId),
          lastRefresh: Date.now(), // Update timestamp to avoid immediate refetch
        }))
      },

      // Set all entries
      setEntries: (entries: AddressBookEntry[]) => {
        set({ entries })
      },
    }),
    {
      name: 'address-book-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

// Create a hook for using the address book with automatic loading
export const useAddressBook = () => {
  const { entries, isLoading, loadAddressBook, shouldRefresh } =
    useAddressBookStore()

  // Load address book if needed
  useEffect(() => {
    if (shouldRefresh()) {
      loadAddressBook()
    }
  }, [shouldRefresh, loadAddressBook])

  return {
    entries,
    isLoading,
    refreshAddressBook: loadAddressBook,
  }
}
