import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SearchedPost } from "@/types/posts.interface";
import CommentInputCard from "./CommentInputCard";
import { commentsRequests } from "@/libs/api_requests/comments.request";
import { PostsRequests } from "@/libs/api_requests/posts.request";

function formatAmount(amount: string | null) {
  if (!amount) return "0";
  return parseFloat(amount).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

const DonationProgressBar = ({
  current,
  target,
}: {
  current: string;
  target: string;
}) => {
  const currentNum = parseFloat(current || "0");
  const targetNum = parseFloat(target || "1");
  const percent = Math.min((currentNum / targetNum) * 100, 100);
  const overFunded = currentNum > targetNum;
  return (
    <View className="my-2">
      <View className="flex-row justify-between mb-1">
        <Text className="text-gray-200 font-bold text-xs">
          Raised: {formatAmount(current)}
        </Text>
        <Text className="text-gray-200 font-bold text-xs">
          Target: {formatAmount(target)}
        </Text>
      </View>
      <View className="h-2 bg-dark-300 rounded-full w-full overflow-hidden">
        <View
          style={{ width: `${percent}%` }}
          className={`h-2 ${
            overFunded ? "bg-success-400" : "bg-primary-500"
          } rounded-full`}
        />
      </View>
      {overFunded && (
        <Text className="text-success-400 font-bold mt-1 text-xs">
          Overfunded by {formatAmount((currentNum - targetNum).toString())}!
        </Text>
      )}
    </View>
  );
};

const TokenCallCard = ({
  token_meta,
}: {
  token_meta: SearchedPost["token_meta"];
}) => {
  const isUpcoming =
    token_meta?.launch_date && new Date(token_meta.launch_date) > new Date();
  return (
    <View className="rounded-2xl p-4 mb-2 bg-dark-200 border border-dark-300">
      <View className="flex-row items-center mb-2">
        {token_meta?.logo_url && (
          <Image
            source={{ uri: token_meta.logo_url }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              marginRight: 10,
              backgroundColor: "#18181b",
            }}
          />
        )}
        <View>
          <Text className="text-white font-bold text-base">
            {token_meta?.token_name}{" "}
            <Text className="text-gray-400">({token_meta?.token_symbol})</Text>
          </Text>
          <View className="flex-row items-center mt-1">
            {isUpcoming ? (
              <Text className="text-yellow-400 font-bold text-xs mr-2">
                Upcoming
              </Text>
            ) : (
              <Text className="text-success-400 font-bold text-xs mr-2">
                Live
              </Text>
            )}
            {token_meta?.launch_date && (
              <Text className="text-gray-400 text-xs">
                Launch: {new Date(token_meta.launch_date).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      </View>
      {token_meta?.description && (
        <Text className="text-gray-200 text-xs mb-1">
          {token_meta.description}
        </Text>
      )}
      <View className="flex-row flex-wrap gap-2 mb-1">
        {token_meta?.initial_price && (
          <Text className="text-gray-200 text-xs mr-2">
            Initial: ${token_meta.initial_price}
          </Text>
        )}
        {token_meta?.target_price && (
          <Text className="text-gray-200 text-xs mr-2">
            Target: ${token_meta.target_price}
          </Text>
        )}
        {token_meta?.market_cap && (
          <Text className="text-gray-200 text-xs mr-2">
            MC: ${token_meta.market_cap}
          </Text>
        )}
      </View>
    </View>
  );
};

export default function SearchPostCard({ post }: { post: SearchedPost }) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [likeStatus, setLikeStatus] = useState(post.like?.status ?? false);
  const [likeCount, setLikeCount] = useState(post._count?.like ?? 0);
  const [commentCount, setCommentCount] = useState(post._count?.comment ?? 0);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const likeFunction = async () => {
      if(likeStatus == true){
        setLikeCount((prev) =>
          likeStatus ? Math.max(prev - 1, 0) : prev - 1
        );
        setLikeStatus(false)
        await PostsRequests.unlikePost(post.like.id, post.id);
        //setLikeStatus(false);
        return;
      } else {
        try {
          await PostsRequests.likePost(post.id);
          setLikeStatus((prev) => !prev);
          setLikeCount((prev) =>
            likeStatus ? Math.max(prev - 1, 0) : prev + 1
          );
        } catch (e) {
          setLikeStatus((prev) => !prev);
          setLikeCount((prev) =>
            likeStatus ? likeCount + 1 : Math.max(likeCount - 1, 0)
          );
        }
      }
  }

  // User header
  const userHeader = (
    <View className="flex-row items-center mb-2">
      <View className="w-9 h-9 rounded-full bg-dark-300 justify-center items-center mr-2">
        <Text className="text-white text-base font-semibold">
          {post.user.display_name?.[0]?.toUpperCase() ?? "?"}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold text-base">
          {post.user.display_name}
          <Text className="text-gray-400 font-normal">
            {" "}
            @{post.user.tag_name}
          </Text>
        </Text>
        <Text className="text-gray-500 text-xs mt-0.5">
          {new Date(post.created_at).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  // Content rendering by type
  let contentBlock = null;
  if (post.post_type === "REGULAR") {
    contentBlock = (
      <View className="mb-2">
        <Text className="text-gray-200 text-base">{post.content}</Text>
      </View>
    );
  } else if (post.post_type === "DONATION" && post.funding_meta) {
    contentBlock = (
      <View className="bg-dark-300 rounded-xl p-3 mb-2">
        <Text className="text-gray-200 text-base mb-1">{post.content}</Text>
        <DonationProgressBar current={post.funding_meta.current_amount} target={post.funding_meta.target_amount} />
        <View className="flex-row items-center mt-1">
          <Ionicons name="wallet-outline" size={16} color="#475569" />
          <Text className="text-gray-400 text-xs ml-2">
            {post.funding_meta.token_symbol || "Token"} on {post.funding_meta.chain_type}
          </Text>
          {post.funding_meta.deadline && (
            <Text className="text-gray-400 text-xs ml-3">
              Ends: {new Date(post.funding_meta.deadline).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    );
  } else if (post.post_type === "TOKEN_CALL" && post.token_meta) {
    contentBlock = (
      <>
        {post.content && (
          <View className="mb-2">
            <Text className="text-gray-200 text-base">{post.content}</Text>
          </View>
        )}
        <TokenCallCard token_meta={post.token_meta} />
      </>
    );
  }

  // Engagement row (like, comment, share)
  const engagementRow = (
    <View className="flex-row items-center mt-2 gap-x-6">
      <TouchableOpacity
        className="flex-row items-center"
        onPress={() => likeFunction()}
        activeOpacity={0.7}
      >
        <Ionicons
          name={likeStatus ? "heart" : "heart-outline"}
          size={20}
          color={likeStatus ? "#ef4444" : "#475569"}
        />
        <Text className="text-gray-400 text-xs ml-1">{likeCount}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="flex-row items-center"
        onPress={() => setShowCommentInput((v) => !v)}
        activeOpacity={0.7}
      >
        <Ionicons name="chatbubble-outline" size={18} color="#6366f1" />
        <Text className="text-gray-400 text-xs ml-1">{commentCount}</Text>
      </TouchableOpacity>
      <TouchableOpacity className="flex-row items-center" activeOpacity={0.7}>
        <Ionicons name="arrow-redo-outline" size={18} color="#475569" />
        <Text className="text-gray-400 text-xs ml-1">Share</Text>
      </TouchableOpacity>
    </View>
  );

  // Handle posting a comment
  const handlePostComment = async (text: string) => {
    setPosting(true);
    setError(null);
    try {
      const res = await commentsRequests.createComment({
        postId: post.id,
        text,
      });
      if (res.success) {
        setCommentCount((prev) => prev + 1);
        setShowCommentInput(false);
      } else {
        setError(res.message || "Failed to post comment");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  return (
    <View className="bg-dark-200 rounded-2xl p-5 mb-4 border border-dark-300">
      {/* Make the whole card pressable to open post-details modal */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          router.push({
            pathname: "/(modals)/post-details",
            params: { postId: post.id },
          })
        }
        className=""
        style={{ flex: 1 }}
      >
        {userHeader}
        {contentBlock}
      </TouchableOpacity>
      {engagementRow}
      {showCommentInput && (
        <CommentInputCard
          onPost={handlePostComment}
          onCancel={() => setShowCommentInput(false)}
          loading={posting}
        />
      )}
      {error && <Text className="text-error-400 text-xs mt-2">{error}</Text>}
    </View>
  );
}
