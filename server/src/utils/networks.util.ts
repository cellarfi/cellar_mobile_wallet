export const SUPPORTED_NETWORKS = ['solana', 'soon', 'sonic'] as const;

export type Network = (typeof SUPPORTED_NETWORKS)[number];
