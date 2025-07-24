import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ActionSheetIOS,
  Modal,
  TextInput,
  Button,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import CommentInputCard from "@/components/core/social/CommentInputCard";
import { useLocalSearchParams, router } from "expo-router";
import { commentsRequests } from "@/libs/api_requests/comments.request";
import { CommentWithReplies } from "@/types/comment.interface";
import { useQuery } from "@tanstack/react-query";

export default function CommentThreadModal() {
  const { commentId, currentUserTagName } = useLocalSearchParams();
  const [mainComment, setMainComment] = useState<CommentWithReplies | null>(
    null
  );
  const [quotedComment, setQuotedComment] = useState<{
    user: { tag_name: string; display_name: string };
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newContent, setNewContent] = useState("");
  const [showEditingModal, setShowEditingModal] = useState(false);
  const [showAndroidActionSheet, setShowAndroidActionSheet] = useState(false);
  const [selectedReplyId, setSelectedReplyId] = useState<string | null>(null);
  const [reload, setReload] = useState(false);

  // Fetch main comment and replies
  const {
    data,
    error: queryError,
    isLoading,
  } = useQuery({
    queryKey: ["commentThread", commentId],
    queryFn: async () => {
      const res = await commentsRequests.getReplies(commentId as string);
      if (res.success && res.data) {
        setMainComment(res.data);
        setQuotedComment({
          user: {
            tag_name: res.data.user.tag_name || "",
            display_name: res.data.user.display_name || "",
          },
          text: res.data.content || "",
        });
        return res.data;
      } else {
        throw new Error(res.message || "Failed to fetch thread");
      }
    },
    refetchInterval: 3000, // Refetch every 3 seconds
    enabled: !!commentId, // Only run query if commentId exists
  });

  useEffect(() => {
    if (queryError) {
      setError(queryError.message || "Failed to fetch thread");
    }
    setLoading(isLoading);
  }, [queryError, isLoading]);

  // Show action sheet for reply actions
  const showReplyActionSheet = (replyId: string, replyContent: string) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Edit", "Delete"],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Edit
            setNewContent(replyContent);
            setSelectedReplyId(replyId);
            setShowEditingModal(true);
          } else if (buttonIndex === 2) {
            // Delete
            handleDeleteReply(replyId);
          }
        }
      );
    } else {
      // Android - show custom action sheet
      setSelectedReplyId(replyId);
      setNewContent(replyContent);
      setShowAndroidActionSheet(true);
    }
  };

  // Handle delete reply
  const handleDeleteReply = async (replyId: string) => {
    try {
      await commentsRequests.deleteComment({
        id: replyId,
        postId: mainComment?.post_id || "",
      });
      alert("Reply deleted successfully");

      // Remove the comment from the state
      setMainComment((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          replies: prev.replies.filter((reply) => reply.id !== replyId),
          _count: {
            ...prev._count,
            replies: Math.max((prev._count.replies || 1) - 1, 0),
          },
        };
      });
    } catch (error) {
      console.error("Failed to delete reply:", error);
    }
  };

  // Handle edit reply
  const handleEditReply = async () => {
    if (!selectedReplyId || !newContent.trim()) return;

    try {
      await commentsRequests.updateComment({
        comment_id: selectedReplyId,
        content: newContent,
      });
      alert("Reply edited successfully");

      // Update State with new content
      setMainComment((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          replies: prev.replies.map((reply) =>
            reply.id === selectedReplyId
              ? { ...reply, content: newContent, updated_at: new Date().toISOString() }
              : reply
          ),
        };
      });

      // Reupdate associated states
      setShowEditingModal(false);
      setShowAndroidActionSheet(false);
      setSelectedReplyId(null);
      setNewContent("");
    } catch (error) {
      console.error("Failed to edit reply:", error);
    }
  };

  // Like/unlike main comment (optimistic)
  const handleLikeMainComment = async () => {
    if (!mainComment) return;
    setMainComment((prev) =>
      prev
        ? {
            ...prev,
            like: prev.like
              ? {
                  ...prev.like,
                  status: !prev.like.status,
                  count: prev.like.status
                    ? Math.max((prev.like.count || 1) - 1, 0)
                    : (prev.like.count || 0) + 1,
                }
              : null,
          }
        : null
    );
    try {
      await commentsRequests.likeComment(mainComment.id);
    } catch (e) {
      // Optionally revert
      console.error("Failed to like comment:", e);
    }
  };

  // Post a reply (optimistic, then refetch)
  const handlePostReply = async (text: string) => {
    if (!mainComment) return;
    setPosting(true);
    setError(null);
    try {
      const res = await commentsRequests.createComment({
        text,
        parentId: mainComment.id,
        postId: mainComment.post_id,
      });
      if (res.success) {
        const threadRes = await commentsRequests.getReplies(mainComment.id);
        if (threadRes.success && threadRes.data) {
          setMainComment(threadRes.data);
        }
      } else {
        setError(res.message || "Failed to post reply");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to post reply");
    } finally {
      setPosting(false);
    }
  };

  if (loading)
    return (
      <SafeAreaView className="flex-1 bg-dark-50 justify-center items-center">
        <ActivityIndicator color="#6366f1" />
        <Text className="text-white mt-2">Loading thread...</Text>
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView className="flex-1 bg-dark-50 justify-center items-center">
        <Text className="text-red-500 mt-2">{error}</Text>
      </SafeAreaView>
    );
  if (!mainComment)
    return (
      <SafeAreaView className="flex-1 bg-dark-50 justify-center items-center">
        <Text className="text-red-500 mt-2">Thread not found</Text>
      </SafeAreaView>
    );

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      <View className="flex-row items-center justify-between px-6 py-4 bg-dark-50 z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-dark-200 rounded-full justify-center items-center"
        >
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Thread</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Main comment visually enhanced */}
        <View className="bg-dark-200 rounded-2xl p-5 mb-4 border-2 border-primary-500 shadow-lg">
          <View className="flex-row items-center mb-2">
            <View className="w-10 h-10 rounded-full bg-dark-300 justify-center items-center mr-3">
              {mainComment.user?.profile_picture_url ? (
                <Image
                  source={{ uri: mainComment.user.profile_picture_url }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "#23272f",
                  }}
                />
              ) : (
                <Text className="text-white text-base font-semibold">
                  {mainComment.user?.display_name?.[0]?.toUpperCase() ?? "?"}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">
                {mainComment.user.display_name}
                <Text className="text-gray-400 font-normal">
                  {" "}
                  @{mainComment.user.tag_name}
                </Text>
              </Text>
              <Text className="text-gray-500 text-xs mt-0.5">
                {new Date(mainComment.created_at).toLocaleString()}
              </Text>
            </View>
          </View>
          <Text className="text-gray-200 text-lg mb-3 font-medium">
            {mainComment.content}
          </Text>
          <View className="flex-row items-center gap-x-6 mt-2">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={handleLikeMainComment}
              activeOpacity={0.7}
            >
              <Ionicons
                name={mainComment.like?.status ? "heart" : "heart-outline"}
                size={22}
                color={mainComment.like?.status ? "#ef4444" : "#475569"}
              />
              <Text className="text-gray-400 text-sm ml-1">
                {mainComment.like?.count ?? 0}
              </Text>
            </TouchableOpacity>
            <View className="flex-row items-center">
              <Ionicons name="chatbubble-outline" size={20} color="#6366f1" />
              <Text className="text-gray-400 text-sm ml-1">
                {mainComment._count.replies ?? 0}
              </Text>
              <Text className="text-primary-400 text-xs ml-1">Replies</Text>
            </View>
          </View>
        </View>

        {/* Replies */}
        <Text className="text-gray-400 text-xs mb-2 -gap-2">Replies</Text>
        {mainComment.replies.map((reply, idx) => (
          <View key={reply.id} className="flex-row items-start mb-6">
            <View
              className={`w-2 ${idx === 0 ? "rounded-t-xl" : ""} ${
                idx === mainComment.replies.length - 1 ? "rounded-b-xl" : ""
              } bg-primary-500/30`}
            />
            <View className="flex-1 ml-2">
              <TouchableOpacity
                activeOpacity={0.92}
                className="bg-dark-200 rounded-2xl p-4 border border-dark-300 flex-row items-start"
                style={{ minHeight: 64 }}
              >
                <View className="w-9 h-9 rounded-full bg-dark-300 justify-center items-center mr-3">
                  {reply.user?.profile_picture_url ? (
                    <Image
                      source={{ uri: reply.user.profile_picture_url }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: "#23272f",
                      }}
                    />
                  ) : (
                    <Text className="text-white text-base font-semibold">
                      {reply.user?.display_name?.[0]?.toUpperCase() ?? "?"}
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Text className="text-white font-semibold text-base">
                        {reply.user.display_name}
                      </Text>
                      <Text className="text-gray-400 text-xs ml-2">
                        @{reply.user.tag_name}
                      </Text>
                      <Text className="text-gray-500 text-xs ml-3">
                        {reply.updated_at &&
                        reply.updated_at !== reply.created_at ? (
                          <>
                            Edited at{" "}
                            {new Date(reply.updated_at).toLocaleString()}
                          </>
                        ) : (
                          <>{new Date(reply.created_at).toLocaleString()}</>
                        )}
                      </Text>
                    </View>
                    {reply.user.tag_name === currentUserTagName && (
                      <TouchableOpacity
                        onPress={() =>
                          showReplyActionSheet(reply.id, reply.content)
                        }
                        className="p-1"
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="ellipsis-horizontal"
                          size={20}
                          color="#64748b"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text className="text-gray-200 text-base mt-1">
                    {reply.content}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View className="mb-24" />
      </ScrollView>

      {/* Android Action Sheet Modal */}
      {Platform.OS === "android" && (
        <Modal
          visible={showAndroidActionSheet}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAndroidActionSheet(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
            activeOpacity={1}
            onPress={() => setShowAndroidActionSheet(false)}
          >
            <View className="flex-1 justify-end">
              <TouchableOpacity activeOpacity={1}>
                <View className="bg-dark-200 rounded-t-3xl p-6 border-t border-dark-300">
                  <View className="w-12 h-1 bg-gray-400 rounded-full self-center mb-4" />

                  <TouchableOpacity
                    className="flex-row items-center py-4 border-b border-dark-300"
                    onPress={() => {
                      setShowAndroidActionSheet(false);
                      setShowEditingModal(true);
                    }}
                  >
                    <Ionicons name="pencil" size={20} color="#6366f1" />
                    <Text className="text-white text-base ml-3 font-medium">
                      Edit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center py-4"
                    onPress={() => {
                      setShowAndroidActionSheet(false);
                      if (selectedReplyId) {
                        handleDeleteReply(selectedReplyId);
                      }
                    }}
                  >
                    <Ionicons name="trash" size={20} color="#ef4444" />
                    <Text className="text-red-500 text-base ml-3 font-medium">
                      Delete
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="mt-4 bg-dark-300 rounded-2xl py-4"
                    onPress={() => setShowAndroidActionSheet(false)}
                  >
                    <Text className="text-gray-300 text-center text-base font-medium">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Edit Modal */}
      <Modal visible={showEditingModal} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-dark-200 rounded-2xl p-6 w-11/12">
            <Text className="text-white text-lg font-bold mb-2">
              Edit Reply
            </Text>
            <TextInput
              className="bg-dark-300 text-white rounded-xl p-3 mb-4 min-h-[80px]"
              multiline
              value={newContent}
              onChangeText={setNewContent}
              placeholderTextColor="#64748b"
              placeholder="Edit your reply..."
            />
            <View className="flex-row justify-end gap-x-3">
              <Button
                title="Cancel"
                onPress={() => {
                  setShowEditingModal(false);
                  setSelectedReplyId(null);
                  setNewContent("");
                }}
                color="#64748b"
              />
              <Button title="Save" onPress={handleEditReply} color="#6366f1" />
            </View>
          </View>
        </View>
      </Modal>

      {/* Reply input at the bottom */}
      <View className="px-6 pb-6 pt-2 bg-dark-50">
        <CommentInputCard
          onPost={handlePostReply}
          loading={posting}
          postLabel="Reply"
        />
      </View>
    </SafeAreaView>
  );
}
