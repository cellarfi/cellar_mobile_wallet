import { create } from 'zustand'

type SocialEventsState = {
  refreshFeed: boolean
  triggerRefresh: () => void
  resetRefresh: () => void
}

export const useSocialEventsStore = create<SocialEventsState>((set) => ({
  refreshFeed: false,
  triggerRefresh: () => set({ refreshFeed: true }),
  resetRefresh: () => set({ refreshFeed: false }),
}))

export const usePostDetailsStore = create<SocialEventsState>((set) => ({
  refreshFeed: false,
  triggerRefresh: () => set({ refreshFeed: true }),
  resetRefresh: () => set({ refreshFeed: false }),
}))

// Store for updating specific post funding amounts without full refresh
type PostFundingUpdate = {
  postId: string
  newAmount: number
} | null

type PostFundingUpdateState = {
  pendingUpdate: PostFundingUpdate
  updatePostFunding: (postId: string, newAmount: number) => void
  clearPendingUpdate: () => void
}

export const usePostFundingUpdateStore = create<PostFundingUpdateState>(
  (set) => ({
    pendingUpdate: null,
    updatePostFunding: (postId: string, newAmount: number) =>
      set({ pendingUpdate: { postId, newAmount } }),
    clearPendingUpdate: () => set({ pendingUpdate: null }),
  })
)

// Store for removing deleted posts from UI without full refresh
type PostDeleteState = {
  pendingDeleteId: string | null
  deletePost: (postId: string) => void
  clearPendingDelete: () => void
}

export const usePostDeleteStore = create<PostDeleteState>((set) => ({
  pendingDeleteId: null,
  deletePost: (postId: string) => set({ pendingDeleteId: postId }),
  clearPendingDelete: () => set({ pendingDeleteId: null }),
}))

// Store for blocking users - removes all posts by that user from UI
type BlockedUserState = {
  blockedUserId: string | null
  blockUser: (userId: string) => void
  clearBlockedUser: () => void
}

export const useBlockedUserStore = create<BlockedUserState>((set) => ({
  blockedUserId: null,
  blockUser: (userId: string) => set({ blockedUserId: userId }),
  clearBlockedUser: () => set({ blockedUserId: null }),
}))
