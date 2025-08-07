import { httpRequest, apiResponse } from "../api.helpers";

export const commentsRequests = {
  createComment: async ({
    postId,
    text,
    parentId,
  }: {
    postId: string;
    text: string;
    parentId?: string;
  }) => {
    try {
      const api = httpRequest();
      const response = await api.post("/posts/comments", {
        post_id: postId,
        text: text,
        parent_id: parentId,
      });
      return apiResponse(true, "Comment created", response.data.data);
    } catch (err: any) {
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

  updateComment: async ({comment_id, content}: {comment_id: string, content: string}) => {
    try {
      const api = httpRequest();
      const response = await api.patch("/posts/comments", {
        id: comment_id,
        content: content,
      });
      return apiResponse(true, "Comment updated", response.data.data);
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error while updating comment",
      )
    }
  },

  deleteComment: async ({ id, postId }: { id: string; postId: string }) => {
    try {
      const api = httpRequest();
      const response = await api.delete("/posts/comments", {
        data: {
          id: id,
          post_id: postId,
        },
      });
      return apiResponse(true, "Comment created", response.data.data);
    } catch (err: any) {
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

  likeComment: async (commentId: string) => {
    try {
      const api = httpRequest();
      const response = await api.post("/posts/comments/like", {
        id: commentId,
      });
      return apiResponse(true, "Comment Liked/Unliked", response.data.data);
    } catch (err: any) {
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


  getReplies: async (commentId: string) => {
    try {
      const api = httpRequest();
      const response = await api.get(`/posts/comments/replies/${commentId}`);
      return apiResponse(true, "Comments fetched", response.data.data);
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error while fetching comment",
        err
      );
    }
  }
};
