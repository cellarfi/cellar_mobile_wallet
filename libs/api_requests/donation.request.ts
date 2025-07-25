import { CreateDonationEntry } from "@/types/donation.interface";
import { apiResponse, httpRequest } from "../api.helpers";

export const donationRequest = {
  createDonation: async (entry: Omit<CreateDonationEntry, 'id' | 'created_at'>) => {
    try {
      const api = httpRequest();
      const response = await api.post(`/donations`, entry);
      return apiResponse<CreateDonationEntry>(
        true,
        "Donation request added successfully.",
        response.data.data
      );
    } catch (err: any) {
      console.log("Error creating donation request:", err?.response?.data);
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error adding address book entry",
        err
      );
    }
  },
};
