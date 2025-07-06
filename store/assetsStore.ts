import { DasApiAssetList } from '@metaplex-foundation/digital-asset-standard-api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AssetsState {
  // Assets data
  assets?: DasApiAssetList;
  isLoading: boolean;
  lastFetch: number | null;
  error: string | null;

  // Actions
  setAssets: (assets: DasApiAssetList) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAssets: () => void;
  updateLastFetch: () => void;
}

export const useAssetsStore = create<AssetsState>()(
  persist(
    (set, get) => ({
      // Initial state
      assets: undefined,
      isLoading: false,
      lastFetch: null,
      error: null,

      // Actions
      setAssets: (assets) => {
        set({
          assets,
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

      clearAssets: () => {
        set({
          assets: {
            items: [],
            limit: 50,
            total: 0,
          } as DasApiAssetList,
          error: null,
          lastFetch: null,
        });
      },

      updateLastFetch: () => {
        set({ lastFetch: Date.now() });
      },
    }),
    {
      name: 'assets-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist assets data and last fetch time for offline support
      // Limit to 25 assets to prevent excessive storage
      partialize: (state) => ({
        assets: state.assets?.items?.slice(0, 25) || [],
        lastFetch: state.lastFetch,
      }),
    }
  )
);
