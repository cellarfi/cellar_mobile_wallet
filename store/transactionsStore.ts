import { Transaction } from '@/types/transaction.interface';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface TransactionsState {
  transactions: Transaction[];
  isLoading: boolean;
  lastFetch: number | null;
  error: string | null;
  setTransactions: (transactions: Transaction[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTransactions: () => void;
  updateLastFetch: () => void;
}

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    (set, get) => ({
      // Initial state
      transactions: [],
      isLoading: false,
      lastFetch: null,
      error: null,

      // Actions
      setTransactions: (transactions) => {
        set({
          transactions,
          error: null,
          lastFetch: Date.now(),
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error, isLoading: false });
      },

      clearTransactions: () => {
        set({
          transactions: [],
          error: null,
          lastFetch: null,
        });
      },

      updateLastFetch: () => {
        set({ lastFetch: Date.now() });
      },
    }),
    {
      name: 'transactions-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist transactions data and last fetch time for offline support
      partialize: (state) => ({
        transactions: state.transactions?.slice(0, 25) || [], // Limit to 25 most recent transactions
        lastFetch: state.lastFetch,
      }),
    }
  )
);
