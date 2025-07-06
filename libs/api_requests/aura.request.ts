import {
  dasApi,
  DasApiAssetList,
  DasApiError,
  DasApiInterface,
  GetAssetsByOwnerRpcInput,
} from '@metaplex-foundation/digital-asset-standard-api';
import { publicKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { apiResponse } from '../api.helpers';

export interface AssetFilterOption {
  key: string;
  label: string;
  filter: (asset: any) => boolean;
}

export const ASSET_FILTER_OPTIONS: AssetFilterOption[] = [
  {
    key: 'all',
    label: 'All NFTs',
    filter: () => true,
  },
  {
    key: 'compressed',
    label: 'Compressed NFTs',
    filter: (asset: any) => {
      try {
        return (
          asset && asset.compression && asset.compression.compressed === true
        );
      } catch (e) {
        return false;
      }
    },
  },
  {
    key: 'non-compressed',
    label: 'Non-Compressed NFTs',
    filter: (asset: any) => {
      try {
        return (
          asset && (!asset.compression || asset.compression.compressed !== true)
        );
      } catch (e) {
        return false;
      }
    },
  },
];

export const auraRequests = {
  /**
   * Get NFT assets owned by a wallet address
   * @param ownerAddress - The owner's wallet address
   * @param limit - Maximum number of results to return
   * @param cursor - Pagination cursor from previous response
   * @param before - Return results before this timestamp
   * @param after - Return results after this timestamp
   * @returns The owner's NFT assets
   */
  getAssetsByOwner: async (
    ownerAddress: string,
    rpcUrl: string,
    {
      limit = 20,
      cursor,
      before,
      after,
      setLoading,
      isLoadingMore = false,
    }: {
      limit?: number;
      cursor?: string;
      before?: string;
      after?: string;
      setLoading?: (loading: boolean) => void;
      isLoadingMore?: boolean; // Flag to indicate if this is a pagination request
    } = {}
  ) => {
    try {
      setLoading?.(true);
      const umi = createUmi(rpcUrl).use(dasApi());

      const params: GetAssetsByOwnerRpcInput = {
        owner: publicKey(ownerAddress),
        limit,
        // displayOptions: {
        //   showInscription: true,
        //   showCollectionMetadata: true,
        //   showFungible: false,
        //   showUnverifiedCollections: true,
        // },
      };

      if (cursor) params.cursor = cursor;
      if (before) params.before = before;
      if (after) params.after = after;

      const assets = await (
        umi.rpc as unknown as DasApiInterface
      ).getAssetsByOwner(params);

      // Guard against empty results
      if (!assets || !assets.items || assets.items.length === 0) {
        console.log('API returned empty or no results');
        return apiResponse<DasApiAssetList>(
          true,
          'No NFT assets found',
          assets
        );
      }

      return apiResponse<DasApiAssetList>(true, 'Fetched NFT assets', assets);
    } catch (err: any) {
      if (
        err instanceof DasApiError &&
        err.message.includes('No assets found for owner')
      ) {
        console.log('No asset found for user');
        return apiResponse<DasApiAssetList>(true, 'Fetched NFT assets', {
          items: [],
          limit,
          total: 0,
        } as DasApiAssetList);
      }

      return apiResponse<DasApiAssetList>(
        false,
        err?.response?.data?.message || err?.message || 'Error occurred.',
        undefined
      );
    } finally {
      setLoading?.(false);
    }
  },
};
