import {
  SearchUser,
  SuggestedAccounts,
  UserProfile,
} from "@/types/socialfi.interface";
import { apiResponse, httpRequest } from "../api.helpers";

const api = httpRequest();

export const SocialFiRequests = {
  like: async (id: string) => {
    try {
      const api = httpRequest();
      const response = await api.post(`socialfi/posts/like`, { postId: id });
      return apiResponse(true, "post liked", response.data.data);
    } catch (err: any) {
      console.log("Error fetching address book entries:", err?.response?.data);
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "error while liking post",
        err
      );
    }
  },

  unLike: async (id: string, postId: string) => {
    try {
      const api = httpRequest();
      const response = await api.post(`socialfi/posts/unlike`, { postId, id });
      return apiResponse(true, "post unliked", response.data.data);
    } catch (err: any) {
      console.log("Error fetching address book entries:", err?.response?.data);
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error while unliking post",
        err
      );
    }
  },

  createComment: async ({
    postId,
    comment,
  }: {
    postId: string;
    comment: string;
  }) => {
    try {
      const api = httpRequest();
      const response = await api.post(`socialfi/posts/comment`, {
        postId: postId,
        text: comment,
      });
      return apiResponse(true, "comment created", response.data.data);
    } catch (err: any) {
      console.log("Error fetching address book entries:", err?.response?.data);
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error while creating comment",
        err
      );
    }
  },

  tipUser: async ({ postId, amount }: { postId: string; amount: number }) => {
    try {
      const api = httpRequest();
      const response = await api.post(`socialfi/posts/tip`, { postId, amount });
      return apiResponse(true, "Tip sent", response.data.data);
    } catch (err: any) {
      console.log("Error sending tip:", err?.response?.data);
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error while sending tip",
        err
      );
    }
  },

  searchUsers: async (query: string) => {
    try {
      const api = httpRequest();
      const response = await api.get(
        `/users/search/?query=${encodeURIComponent(query)}`
      );
      return apiResponse(
        true,
        "users search fetched successfully",
        response.data.data as SearchUser[]
      );
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error searching users",
        err
      );
    }
  },

  getUserProfile: async (userId: string) => {
    try {
      const api = httpRequest();
      const response = await api.get(
        `/socialfi/user-profile?query=${encodeURIComponent(userId)}`
      );
      return apiResponse<UserProfile>(
        true,
        "user profile fetched successfully",
        response.data.data
      );
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error fetching user profile",
        err
      );
    }
  },

  follow: async (userId: string) => {
    try {
      const api = httpRequest();
      const response = await api.post(`/socialfi/follow-user`, {
        userId: userId,
      });
      return apiResponse<UserProfile>(
        true,
        "Followed Action Performed",
        response.data.data
      );
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error following this account",
        err
      );
    }
  },

  suggestedAccounts: async (userId: string) => {
    try {
      const api = httpRequest();
      const response = await api.get(`/socialfi/suggested-accounts`);
      return apiResponse<SuggestedAccounts>(
        true,
        "Posts Fetched",
        response.data.data
      );
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error fetching suggested accounts",
        err
      );
    }
  },

  personalizedPosts: async () => {
    try {
      const api = httpRequest();
      const response = await api.get(`socialfi/personalized/posts`);
      return apiResponse<Posts>(
        true,
        "personalized posts fetched successfully",
        response.data.data
      );
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error fetching personalized posts",
        err
      );
    }
  },

  getPopularHashtags: async () => {
    try {
      const api = httpRequest();
      const response = await api.get(`socialfi/posts/hashtags/popular`);
      return apiResponse(
        true,
        "popular hashtags fetched successfully",
        response.data.data
      );
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error fetching popular hashtags",
        err
      );
    }
  },

  getPostsByHashtag: async (hashtag: string) => {
    try {
      const api = httpRequest();
      const response = await api.get(
        `socialfi/posts/hashtag/${encodeURIComponent(hashtag)}`
      );
      return apiResponse(
        true,
        "posts by hashtag fetched successfully",
        response.data.data
      );
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error fetching posts by hashtag",
        err
      );
    }
  },
};
