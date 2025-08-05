import PostComposer from '@/components/core/social/PostComposer';
import { PostsRequests } from '@/libs/api_requests/posts.request';
import { isValidSolanaAddress, USDC_METADATA } from '@/libs/solana.lib';
import { useAuthStore } from '@/store/authStore';
import { BirdEyeSearchTokenResult } from '@/types';
import { PostType } from '@/types/posts.interface';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

// Zod schemas for validation (unchanged)
const regularSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  post_type: z.literal('REGULAR'),
  media: z.array(z.string()).optional(),
});
const donationSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  post_type: z.literal('DONATION'),
  target_amount: z
    .number()
    .int()
    .positive('Target amount must be a positive integer'),
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
  logo_url: z.string().optional(),
  target_price: z.number().positive().optional(),
  initial_price: z.number().positive().optional(),
  market_cap: z.number().positive().optional(),
});

const initialForm = {
  // Common
  content: '',
  postType: 'REGULAR' as PostType,
  media: [],
  // Donation (simplified - only user inputs)
  targetAmount: '',
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
  const { activeWallet } = useAuthStore();
  const [form, setForm] = useState(initialForm);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedToken, setSelectedToken] =
    useState<BirdEyeSearchTokenResult | null>(null);

  // Get parameters for token selection
  const { selectedToken: selectedTokenParam } = useLocalSearchParams<{
    selectedToken?: string;
  }>();

  // Handle token selection from search modal
  useEffect(() => {
    if (selectedTokenParam && selectedTokenParam !== 'undefined') {
      try {
        const token: BirdEyeSearchTokenResult = JSON.parse(selectedTokenParam);
        console.log('Selected token for post composer:', token);

        // Set the selected token object
        setSelectedToken(token);

        // Populate form fields with token data
        setForm((prev) => ({
          ...prev,
          tokenName: token.name,
          tokenSymbol: token.symbol,
          tokenAddress: token.address,
          tokenChainType: 'Solana', // Default to Solana
          logoUrl: token.logo_uri || '', // Use token's logo_uri
          // Auto-populate numeric fields from token data (convert to strings)
          marketCap: token.market_cap ? token.market_cap.toString() : '',
          initialPrice: token.price ? token.price.toString() : '',
        }));

        // Clear the parameter to avoid re-triggering
        router.setParams({ selectedToken: undefined });
      } catch (error) {
        console.error('Failed to parse selectedToken parameter:', error);
      }
    }
  }, [selectedTokenParam, router]);

  const handleFieldChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (type: PostType) => {
    setForm((prev) => ({ ...prev, postType: type }));
  };

  const handleCreatePost = async (media: string[]) => {
    setPostError(null);
    setFieldErrors({});
    // Build payload and validate
    let payload: any = {
      content: form.content,
      post_type: form.postType,
      media: media || form.media,
    };
    let schema: z.ZodTypeAny = regularSchema;
    if (form.postType === 'DONATION') {
      // Check if user has an active wallet
      if (!activeWallet?.address) {
        setPostError('You need to connect a wallet to create a donation post.');
        return;
      }

      // Auto-populate donation fields with defaults
      payload = {
        ...payload,
        target_amount: parseInt(form.targetAmount) || 0,
        wallet_address: activeWallet.address, // Auto from authStore
        chain_type: 'Solana', // Default to Solana
        token_symbol: USDC_METADATA.symbol, // Default to USDC
        token_address: USDC_METADATA.address, // Default to USDC address
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
        target_price: form.targetPrice
          ? parseFloat(form.targetPrice)
          : undefined,
        initial_price: form.initialPrice
          ? parseFloat(form.initialPrice)
          : undefined,
        market_cap: form.marketCap ? parseFloat(form.marketCap) : undefined,
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
      console.log('TOKEN_CALL errors', errors);
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
        selectedToken={selectedToken}
      />
    </SafeAreaView>
  );
}
