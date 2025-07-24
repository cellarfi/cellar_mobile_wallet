import { create } from "zustand";

type SocialEventsState = {
  refreshFeed: boolean;
  triggerRefresh: () => void;
  resetRefresh: () => void;
};

export const useSocialEventsStore = create<SocialEventsState>((set) => ({
  refreshFeed: false,
  triggerRefresh: () => set({ refreshFeed: true }),
  resetRefresh: () => set({ refreshFeed: false }),
}));

export const usePostDetailsStore = create<SocialEventsState>((set) => ({
  refreshFeed: false,
  triggerRefresh: () => set({ refreshFeed: true }),
  resetRefresh: () => set({ refreshFeed: false }),
}));
