export interface CreateCommentPayload {
  postId: string;
  text: string;
  parentId?: string;
}

export interface DeleteCommentPayload {
  id: string;
  postId: string;
}

export interface LikeCommentPayload {
  commentId: string;
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: Date | string;
}

export type Comment = {
    content: string;
    post_id: string;
    id: string;
    user_id: string;
    created_at: Date | string;
    updated_at: Date | string;
    parentId: string | null;
    like: {
      count: number;
      status: boolean;
      id: string | null;
    };
    _count: {
      CommentLike: number;
    };
    user: {
      display_name: string;
      tag_name: string;
      profile_picture_url?: string;
      id?: string;
    };
  };

export interface CommentWithReplies {
  id: string;
  user: {
    display_name: string;
    tag_name: string;
    profile_picture_url: string | null;
  };
  content: string;
  post_id: string;
  created_at: string;
  replies: {
    id: string;
    content: string;
    user: {
      tag_name: string;
      display_name: string;
      profile_picture_url: string | null;
    };
    created_at: string;
    updated_at: string;
  }[];
  _count: {
    CommentLike: number;
    replies: number;
  };
  like: {
    count: number;
    status: boolean;
    id: string;
  }| null;
}
