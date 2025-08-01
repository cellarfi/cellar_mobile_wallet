import { CreateUserDto, UpdateUserDto, User } from "@/types";
import { SearchUsers } from '@/types/user.interface';
import { apiResponse, httpRequest } from '../api.helpers';

export const userRequests = {
  /**
   * Get the current user's profile
   */
  getProfile: async () => {
    try {
      const api = httpRequest();
      const response = await api.get('/users/me');
      return apiResponse<User>(
        true,
        'User profile fetched successfully',
        response.data?.data
      );
    } catch (err: any) {
      console.log('Error fetching user profile:', err?.response?.data?.data);
      return apiResponse<User>(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error fetching user profile',
        undefined
      );
    }
  },

  /**
   * Create a new user
   * @param userData The user data to create
   */
  createUser: async (userData: CreateUserDto) => {
    try {
      const api = httpRequest();
      const response = await api.post('/users', userData);
      return apiResponse<User>(
        true,
        'User created successfully',
        response.data?.data
      );
    } catch (err: any) {
      console.log('Error creating user:', err?.response?.data?.data);
      return apiResponse<User>(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error creating user',
        undefined
      );
    }
  },

  /**
   * Check if a tag name already exists
   * @param tagName The tag name to check
   */
  checkTagNameExists: async (tagName: string) => {
    try {
      const api = httpRequest();
      const response = await api.get(
        `/users/exists/tag_name/${encodeURIComponent(tagName)}`
      );
      return apiResponse<{ exists: boolean }>(
        true,
        'Tag name check successful',
        response.data
      );
    } catch (err: any) {
      console.log('Error checking tag name:', err?.response?.data);
      return apiResponse<{ exists: boolean }>(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error checking tag name',
        { exists: false }
      );
    }
  },

  /**
   * Update the current user's profile
   * @param userData The user data to update
   */
  updateProfile: async (userData: UpdateUserDto) => {
    try {
      const api = httpRequest();
      const response = await api.patch('/users/me', userData);
      return apiResponse<User>(
        true,
        'User profile updated successfully',
        response.data?.data
      );
    } catch (err: any) {
      console.log('Error updating user profile:', err?.response?.data);
      return apiResponse<User>(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error updating user profile',
        undefined
      );
    }
  },

  /**
   * Get a user by their tag name
   * @param tagName The tag name to lookup (without @ symbol)
   */
  getUserByTagName: async (tagName: string) => {
    try {
      const api = httpRequest();
      const response = await api.get(
        `/users/tag_name/${encodeURIComponent(tagName)}?include=wallets`
      );

      return apiResponse<User>(
        true,
        'User found successfully',
        response.data?.data
      );
    } catch (err: any) {
      console.log('Error finding user by tag name:', err?.response?.data);
      if (err?.response?.status === 404) {
        return apiResponse<User>(
          false,
          `User with tag name @${tagName} not found`,
          undefined
        );
      }
      return apiResponse<User>(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error finding user by tag name',
        undefined
      );
    }
  },

  /**
   * Delete the current user's account
   */
  deleteAccount: async () => {
    try {
      const api = httpRequest();
      const response = await api.delete<never>('/users/me');
      return apiResponse(true, 'User deleted successfully', response.data);
    } catch (err: any) {
      console.log('Error deleting user:', err?.response?.data?.data);
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error deleting user',
        null
      );
    }
  },

  /**
   * Check if a user exists and create if not
   * @param userData The user data to create if needed
   */
  checkAndCreateUser: async (userData: CreateUserDto) => {
    try {
      // First try to get the user profile
      const profileResponse = await userRequests.getProfile();

      // If user exists, return the profile
      if (profileResponse.success) {
        return profileResponse;
      }

      // If user doesn't exist, create new user
      return await userRequests.createUser(userData);
    } catch (err: any) {
      console.log('Error in check and create user:', err);
      return apiResponse(false, 'Error checking or creating user', null);
    }
  },

  /**
   * Get User Profile by Tag Name
   * @param tagName The user Tag Name
   */
  getUserProfile: async (tagName: string) => {
    try {
      const api = httpRequest();
      const response = await api.get(`/users/profile/${tagName}`);
      console.log(response.data.data);
      return apiResponse(
        true,
        'User profile fetched successfully',
        response.data?.data
      );
    } catch (err: any) {
      console.log('Error getting user:', err?.response?.data?.data);
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error getting user',
        undefined
      );
    }
  },

  /**
   * Search for registered users by tag name, display name, or wallet address
   * @param query - The search term to match against user profiles
   * @returns Promise<ApiResponse<SearchUsers>> - Returns an array of matching user profiles
   * @example
   * // Search for users with "john" in their tag name or display name
   * const result = await searchUsers("john");
   * if (result.success) {
   *   console.log(result.data); // Array of matching user profiles
   * }
   */
  searchUsers: async (query: string) => {
    try {
      const api = httpRequest();
      const response = await api.get(
        `/users/search?query=${encodeURIComponent(query)}`
      );
      return apiResponse<SearchUsers>(
        true,
        'Users found successfully',
        response.data?.data
      );
    } catch (err: any) {
      console.log('Error searching users:', err?.response?.data?.data);
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error searching users',
        undefined
      );
    }
  },
};