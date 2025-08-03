import { commentsRequests } from '@/libs/api_requests/comments.request';
import { useAuthStore } from '@/store/authStore';
import { Comment } from '@/types/comment.interface';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActionSheetIOS,
  Button,
  Image,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CommentInputCard from './CommentInputCard';

export default function CommentThread({
  comments: initialComments,
  onDelete,
  onReply,
  onLike,
  postId,
  currentUserId,
}: {
  comments: Comment[];
  onDelete: (commentId: string, parentId: string) => void;
  onReply: (commentId: string, text: string) => void;
  onLike: (commentId: string) => void;
  postId: string;
  currentUserId?: string;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [showModal, setShowModal] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null
  );
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuthStore();

  // Optimistic like/unlike for comments
  const handleLikeComment = async (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const liked = c.like?.status;
        return {
          ...c,
          like: {
            ...c.like,
            status: !liked,
            count: liked ? (c.like?.count || 1) - 1 : (c.like?.count || 0) + 1,
          },
        };
      })
    );
    try {
      await commentsRequests.likeComment(commentId);
    } catch (e) {
      // Revert UI if needed
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== commentId) return c;
          const liked = c.like?.status;
          return {
            ...c,
            like: {
              ...c.like,
              status: !liked,
              count: liked
                ? (c.like?.count || 1) - 1
                : (c.like?.count || 0) + 1,
            },
          };
        })
      );
    }
  };

  // Handle reply post
  const handleReplyPost = async (text: string) => {
    if (replyTo) {
      setReplyLoading(true);
      setError(null);
      try {
        const response = await commentsRequests.createComment({
          text: text,
          parentId: replyTo.id,
          postId: postId,
        });
        if (response && response.success) {
          // Optimistically add reply and increment reply count
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyTo.id
                ? {
                    ...c,
                    _count: {
                      ...c._count,
                      CommentLike: (c._count.CommentLike || 0) + 1,
                    },
                  }
                : c
            )
          );
        } else {
          setError('An error occurred while commenting.');
        }
      } catch (error) {
        setError('An error occurred while commenting.');
      } finally {
        setReplyTo(null);
        setReplyLoading(false);
      }
    }
  };

  // Handle delete comment
  const handleDelete = async (commentId: string, parentId?: string | null) => {
    setError(null);
    try {
      const res = await commentsRequests.deleteComment({
        id: commentId,
        postId: postId,
      });
      if (res.success) {
        if (parentId) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId
                ? {
                    ...c,
                    _count: {
                      ...c._count,
                      CommentLike: Math.max((c._count.CommentLike || 1) - 1, 0),
                    },
                  }
                : c
            )
          );
        }
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        setError(res.message || 'Failed to delete comment');
      }
    } catch (e) {
      setError('Failed to delete comment');
    }
  };

  // Handle the comment content editing
  const handleEditComment = async () => {
    const comment_id = editingComment ? editingComment?.id : '';
    const content = editContent.trim();
    setError(null);
    try {
      const res = await commentsRequests.updateComment({
        comment_id: comment_id,
        content: content,
      });
      if (res.success) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === comment_id ? { ...c, content: content } : c
          )
        );
        setEditingComment(null);
        setEditContent('');
      } else {
        setError(res.message || 'Failed to update comment');
      }
    } catch (e) {
      setError('Failed to update comment');
    } finally {
      setEditingComment(null);
      setEditContent('');
    }
  };

  const handleMenu = (comment: Comment) => {
    const isOwner =
      currentUserId &&
      (comment.user_id === currentUserId || comment.user?.id === currentUserId);
    if (Platform.OS === 'ios') {
      const options = ['Cancel'];
      const destructiveIndex: number[] = [];
      if (isOwner) {
        options.push('Edit');
        options.push('Delete');
        destructiveIndex.push(options.length - 1);
      }
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: destructiveIndex[0],
        },
        (buttonIndex) => {
          if (isOwner && buttonIndex === options.indexOf('Edit')) {
            setEditingComment(comment);
            setEditContent(comment.content);
          } else if (isOwner && buttonIndex === options.indexOf('Delete')) {
            handleDelete(comment.id, comment.parentId);
          }
        }
      );
    } else {
      setSelectedCommentId(comment.id);
      setShowModal(true);
    }
  };

  const handleDeleteModal = () => {
    if (selectedCommentId) {
      const comment = comments.find((c) => c.id === selectedCommentId);
      handleDelete(selectedCommentId, comment?.parentId);
    }
    setShowModal(false);
    setSelectedCommentId(null);
  };

  return (
    <View className="mt-3">
      {comments.map((comment) => {
        const isOwner =
          currentUserId &&
          (comment.user_id === currentUserId ||
            comment.user?.id === currentUserId);
        return (
          <TouchableOpacity
            key={comment.id}
            className="flex-row items-start mb-4 bg-dark-200 rounded-2xl p-4 shadow-sm border border-dark-300"
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: '/(modals)/comment-thread',
                params: {
                  commentId: comment.id,
                  currentUserTagName: profile?.tag_name,
                },
              })
            }
          >
            {comment.user?.profile_picture_url ? (
              <Image
                source={{ uri: comment.user.profile_picture_url }}
                className="w-9 h-9 rounded-full mr-3 bg-dark-300"
              />
            ) : (
              <View className="w-9 h-9 rounded-full mr-3 bg-dark-300 justify-center items-center">
                <Text className="text-white text-base font-semibold">
                  {comment.user?.display_name?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-white font-semibold text-base">
                  {comment.user?.display_name}
                </Text>
                <Text className="text-gray-400 text-xs ml-2">
                  @{comment.user?.tag_name}
                </Text>
                <Text className="text-gray-500 text-xs ml-3">
                  {comment.updated_at &&
                  comment.updated_at !== comment.created_at ? (
                    <>
                      Edited at {new Date(comment.updated_at).toLocaleString()}
                    </>
                  ) : (
                    <>{new Date(comment.created_at).toLocaleString()}</>
                  )}
                </Text>
                {/* 3-dots menu */}
                {isOwner && (
                  <TouchableOpacity
                    className="ml-2 p-1"
                    onPress={() => handleMenu(comment)}
                  >
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={18}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                )}
              </View>
              <Text className="text-gray-200 text-base mt-1">
                {comment.content}
              </Text>
              {/* Like and Reply Row - improved spacing */}
              <View className="flex-row items-center gap-x-6 mt-2">
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => handleLikeComment(comment.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={comment.like?.status ? 'heart' : 'heart-outline'}
                    size={18}
                    color={comment.like?.status ? '#ef4444' : '#475569'}
                  />
                  <Text className="text-gray-400 text-xs ml-1">
                    {comment.like?.count ?? comment._count?.CommentLike ?? 0}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => setReplyTo(comment)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color="#6366f1"
                  />
                  <Text className="text-gray-400 text-xs ml-1">
                    {comment._count?.CommentLike ?? 0}
                  </Text>
                  <Text className="text-primary-400 text-xs ml-1">Reply</Text>
                </TouchableOpacity>
              </View>
              {/* Reply input for this comment */}
              {replyTo?.id === comment.id && (
                <View className="mt-4">
                  {/* Quoted comment */}
                  <View className="bg-dark-300 rounded-xl px-4 py-3 mb-2 border border-dark-400">
                    <Text className="text-gray-400 text-xs mb-1">
                      Replying to @{comment.user?.tag_name}
                    </Text>
                    <Text className="text-gray-200 text-sm">
                      {comment.content}
                    </Text>
                  </View>
                  <CommentInputCard
                    onPost={handleReplyPost}
                    onCancel={() => setReplyTo(null)}
                    loading={replyLoading}
                    quotedComment={{
                      user: {
                        display_name: comment.user?.display_name || '',
                        tag_name: comment.user?.tag_name || '',
                      },
                      text: comment.content,
                    }}
                    postLabel="Reply"
                  />
                  {error && (
                    <Text className="text-error-400 text-xs mt-2">{error}</Text>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
      {/* Edit Modal Scaffold for Comment */}
      <Modal visible={!!editingComment} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-dark-200 rounded-2xl p-6 w-11/12">
            <Text className="text-white text-lg font-bold mb-2">
              Edit Comment
            </Text>
            <TextInput
              className="bg-dark-300 text-white rounded-xl p-3 mb-4 min-h-[80px]"
              multiline
              value={editContent}
              onChangeText={setEditContent}
            />
            <View className="flex-row justify-end gap-x-3">
              <Button
                title="Cancel"
                onPress={() => setEditingComment(null)}
                color="#64748b"
              />
              <Button
                title="Save"
                onPress={() => {
                  handleEditComment();
                }}
                color="#6366f1"
              />
            </View>
          </View>
        </View>
      </Modal>
      {/* Android modal for delete */}
      {Platform.OS !== 'ios' && showModal && (
        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/40 justify-center items-center"
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          >
            <View className="bg-dark-200 rounded-xl p-6 min-w-[200px]">
              <TouchableOpacity onPress={handleDeleteModal} className="mb-3">
                <Text className="text-error-400 font-bold text-base">
                  Delete
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text className="text-gray-400 text-base">Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}
