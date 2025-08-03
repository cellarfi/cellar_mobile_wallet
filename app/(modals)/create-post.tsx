import PostComposer from '@/components/core/social/PostComposer';
import { PostsRequests } from '@/libs/api_requests/posts.request';
import { isValidSolanaAddress } from '@/libs/solana.lib';
import { PostType } from '@/types/posts.interface';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

// Zod schemas for validation (unchanged)
const regularSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  post_type: z.literal('REGULAR'),
});
const donationSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  post_type: z.literal('DONATION'),
  target_amount: z.number().positive('Target amount must be positive'),
  wallet_address: z
    .string()
    .min(1, 'Wallet address is required')
    .refine((val) => isValidSolanaAddress(val) !== false, {
      message: 'Invalid wallet address',
    }),
  chain_type: z.string().min(1, 'Chain type is required'),
  token_symbol: z.string().optional(),
  token_address: z.string().optional(),
  deadline: z.string().datetime().optional(),
});
const tokenCallSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  post_type: z.literal('TOKEN_CALL'),
  token_name: z.string().min(1, 'Token name is required'),
  token_symbol: z.string().min(1, 'Token symbol is required'),
  token_address: z.string().min(1, 'Token address is required'),
  chain_type: z.string().min(1, 'Chain type is required'),
  logo_url: z.string().url().optional(),
  launch_date: z.string().datetime().optional(),
  initial_price: z.number().positive().optional(),
  target_price: z.number().positive().optional(),
  market_cap: z.number().positive().optional(),
  description: z.string().optional(),
});

const initialForm = {
  // Common
  content: '',
  postType: 'REGULAR' as PostType,
  mediaUrls: [],
  // Donation
  targetAmount: '',
  walletAddress: '',
  chainType: '',
  donationTokenSymbol: '',
  donationTokenAddress: '',
  deadline: undefined as string | undefined,
  // Token Call
  tokenName: '',
  tokenSymbol: '',
  tokenAddress: '',
  tokenChainType: '',
  logoUrl: '',
  launchDate: undefined as string | undefined,
  initialPrice: '',
  targetPrice: '',
  marketCap: '',
  description: '',
};

export default function CreatePostScreen() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (type: PostType) => {
    setForm((prev) => ({ ...prev, postType: type }));
  };

  const handleCreatePost = async () => {
    setPostError(null);
    setFieldErrors({});
    // Build payload and validate
    let payload: any = { content: form.content, post_type: form.postType };
    let schema: z.ZodTypeAny = regularSchema;
    if (form.postType === 'DONATION') {
      payload = {
        ...payload,
        target_amount: Number(form.targetAmount),
        wallet_address: form.walletAddress,
        chain_type: form.chainType,
        token_symbol: form.donationTokenSymbol || undefined,
        token_address: form.donationTokenAddress || undefined,
        deadline: form.deadline || undefined,
      };
      schema = donationSchema;
    } else if (form.postType === 'TOKEN_CALL') {
      payload = {
        ...payload,
        token_name: form.tokenName,
        token_symbol: form.tokenSymbol,
        token_address: form.tokenAddress,
        chain_type: form.tokenChainType,
        logo_url: form.logoUrl || undefined,
        launch_date: form.launchDate || undefined,
        initial_price: form.initialPrice
          ? Number(form.initialPrice)
          : undefined,
        target_price: form.targetPrice ? Number(form.targetPrice) : undefined,
        market_cap: form.marketCap ? Number(form.marketCap) : undefined,
        description: form.description || undefined,
      };
      schema = tokenCallSchema;
    }
    // Validate
    const result = schema.safeParse(payload);
    if (!result.success) {
      // Map Zod errors to fieldErrors
      const errors: Record<string, string> = {};
      for (const err of result.error.errors) {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      }
      setFieldErrors(errors);
      setPostError('Please fix the errors above.');
      return;
    }
    setPosting(true);
    try {
      const res = await PostsRequests.createPost(payload);
      if (res.success) {
        router.replace('/social');
      } else {
        setPostError(res.message || 'Failed to create post');
      }
    } catch (err: any) {
      setPostError(err?.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-main px-6 py-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-2xl font-bold">Create Post</Text>
        <Text
          className="text-secondary text-lg"
          onPress={() => router.replace('/social')}
        >
          Cancel
        </Text>
      </View>
      <PostComposer
        form={form}
        onFieldChange={handleFieldChange}
        onTypeChange={handleTypeChange}
        onSubmit={handleCreatePost}
        loading={posting}
        error={postError}
        fieldErrors={fieldErrors}
      />
    </SafeAreaView>
  );
}
