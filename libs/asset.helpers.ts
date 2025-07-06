import { DasApiAsset } from '@metaplex-foundation/digital-asset-standard-api';

export const getAssetUri = (asset: DasApiAsset) => {
  const imageUrl =
    ((asset.content?.links as any)?.image as string) ||
    asset.content?.files?.find((f) => f.mime?.startsWith('image/'))?.uri ||
    '';
  return imageUrl;
};
