export type PostType = "REGULAR" | "DONATION" | "TOKEN_CALL";

export interface PostComposerForm {
  content: string;
  postType: PostType;
  media: string[];
  // Donation
  targetAmount: string;
  walletAddress: string;
  chainType: string;
  donationTokenSymbol: string;
  donationTokenAddress: string;
  deadline?: string;
  // Token Call
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
  tokenChainType: string;
  logoUrl: string;
  launchDate?: string;
  initialPrice: string;
  targetPrice: string;
  marketCap: string;
  description: string;
}

export interface PostComposerProps {
  form: PostComposerForm;
  onFieldChange: (field: string, value: any) => void;
  onTypeChange: (type: PostType) => void;
  onSubmit: (media: string[]) => void;
  loading: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string>;
}
export interface Post {
  id: string;
  content: string;
  user_id: string;
  media?: string[];
  post_type: PostType;
  created_at: string;
  updated_at: string;
  comment: {
    content: string;
    post_id: string;
    id: string;
    user_id: string;
    created_at: Date;
    updated_at: Date;
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
      id: string;
      tag_name: string;
      display_name: string;
      profile_picture_url: string | null;
    };
  }[];
  _count: {
    comment: number;
    like: number;
  };
  user: {
    id: string;
    tag_name: string;
    display_name: string;
    profile_picture_url: string | null;
    wallets: {
      address: string;
    };
  };
  funding_meta: {
    target_amount: string;
    current_amount: string;
    wallet_address: string;
    chain_type: string;
    token_symbol: string | null;
    token_address: string | null;
    deadline: string | null;
    status: string;
  } | null;
  token_meta: {
    token_name: string;
    token_symbol: string;
    token_address: string;
    chain_type: string;
    logo_url: string | null;
    launch_date: string | null;
    initial_price: string | null;
    target_price: string | null;
    market_cap: string | null;
    description: string | null;
  } | null;
  like: {
    count: number;
    status: boolean;
    id: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalComments: number;
    totalPages: number;
  };
}

export interface SearchedPost {
  id: string;
  content: string;
  user_id: string;
  post_type: PostType;
  created_at: string;
  updated_at: string;
  _count: {
    comment: number;
    like: number;
  };
  user: {
    id: string;
    tag_name: string;
    display_name: string;
    profile_picture_url: string | null;
  };
  funding_meta: {
    target_amount: string;
    current_amount: string;
    wallet_address: string;
    chain_type: string;
    token_symbol: string | null;
    token_address: string | null;
    deadline: string | null;
    status: string;
  } | null;
  token_meta: {
    token_name: string;
    token_symbol: string;
    token_address: string;
    chain_type: string;
    logo_url: string | null;
    launch_date: string | null;
    initial_price: string | null;
    target_price: string | null;
    market_cap: string | null;
    description: string | null;
  } | null;
  like: {
    count: number;
    status: boolean;
    id: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalPosts: number;
    totalPages: number;
  };
}
