import { DasApiAssetList } from '@metaplex-foundation/digital-asset-standard-api';

export interface AuraAssetsResponse {
  id: string;
  jsonrpc: string;
  result: DasApiAssetList;
}
