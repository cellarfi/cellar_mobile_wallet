// Format transaction ID to show only first and last few characters
export const formatTxId = (txId: string) => {
  if (!txId) return '';
  if (txId.length <= 13) return txId;
  return `${txId.slice(0, 6)}...${txId.slice(-6)}`;
};
