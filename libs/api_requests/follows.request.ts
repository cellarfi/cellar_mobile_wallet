import { httpRequest, apiResponse } from "../api.helpers";

export const followsRequests = {
  getSuggestedAccounts: async () => {
    try {
      const api = httpRequest();
      const response = await api.get("/follows/suggested-accounts");
      return apiResponse(
        true,
        "Suggested Accounts to follow fetched",
        response.data.data
      );
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error fetching suggested accounts to follow",
        err
      );
    }
  },

  followUser: async (user_id: string) => {
    try {
      const api = httpRequest();
      const response = await api.post(
        `/follows/user`, { user_id }
      );
      return apiResponse(true, `following user with id ${user_id}`, response.data.data);
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error while following user",
        err
      );
    }
  },
};
