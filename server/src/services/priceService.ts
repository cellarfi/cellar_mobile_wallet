import { birdEyeDefiRequests } from "@/utils/api_requests/birdeye/birdeye_defi.request";

export class PriceService {
  static async fetchPrice(token_address: string): Promise<number> {
    try {
      const response = await birdEyeDefiRequests.tokenPrice(token_address);
      const data = response.data
      if (response.success) {
        const price = response.data?.data.value
        if (typeof price === 'number') {
          return price;
        }
        console.error('Unexpected response structure from Birdeye API:', data);
        return 0;
      } else {
        console.error('Birdeye API responded with status:', data);
        return 0;
      }
    } catch (e) {
      console.error('Failed to fetch token price for', token_address, e);
      return 0;
    }
  }
}
