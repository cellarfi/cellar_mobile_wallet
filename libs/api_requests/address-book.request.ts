import { AddressBookEntry } from '@/types'
import { apiResponse, httpRequest } from '../api.helpers'

export const addressBookRequests = {
  /**
   * Get all address book entries for a wallet
   */
  getAddressBook: async () => {
    try {
      const api = httpRequest()
      const response = await api.get(`/wallet/address-book`)
      return apiResponse<AddressBookEntry[]>(
        true,
        'Address book entries fetched successfully',
        response.data.data
      )
    } catch (err: any) {
      console.log('Error fetching address book entries:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error fetching address book entries',
        err
      )
    }
  },

  /**
   * Get a specific address book entry
   * @param entryId The ID of the specific entry
   */
  getAddressBookEntry: async (entryId: string) => {
    try {
      const api = httpRequest()
      const response = await api.get(`/wallet/address-book/${entryId}`)
      return apiResponse<{ data: AddressBookEntry }>(
        true,
        'Address book entry fetched successfully',
        response.data.data
      )
    } catch (err: any) {
      console.log('Error fetching address book entry:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error fetching address book entry',
        err
      )
    }
  },

  /**
   * Add a new address book entry
   * @param entry The address book entry data
   */
  addAddressBookEntry: async (
    entry: Omit<AddressBookEntry, 'id' | 'created_at' | 'updated_at'>
  ) => {
  try {
    const api = httpRequest()
    const response = await api.post(`/wallet/address-book`, entry)
    return apiResponse<AddressBookEntry>(
      true,
      'Address book entry added successfully',
      response.data.data
    )
  } catch (err: any) {
    console.log('Error adding address book entry:', err?.response?.data)
    return apiResponse(
      false,
      err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Error adding address book entry',
      err
    )
  }
  },

  /**
   * Update an existing address book entry
   * @param entryId The ID of the entry to update
   * @param entry The updated address book entry data
   */
  updateAddressBookEntry: async (
    entryId: string,
    entry: Partial<Omit<AddressBookEntry, 'id'>>,
    setLoading?: (loading: boolean) => void
  ) => {
    try {
      const api = httpRequest(setLoading)
      const response = await api.patch(`/wallet/address-book/${entryId}`, entry)
      return apiResponse<AddressBookEntry>(
        true,
        'Address book entry updated successfully',
        response.data.data
      )
    } catch (err: any) {
      console.log('Error updating address book entry:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error updating address book entry',
        err
      )
    }
  },

  /**
   * Delete an address book entry
   * @param entryId The ID of the entry to delete
   */
  deleteAddressBookEntry: async (entryId: string) => {
    try {
      const api = httpRequest()
      await api.delete(`/wallet/address-book/${entryId}`)
      return apiResponse<boolean>(
        true,
        'Address book entry deleted successfully',
        true
      )
    } catch (err: any) {
      console.log('Error deleting address book entry:', err?.response?.data)
      return apiResponse<boolean>(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error deleting address book entry',
        false
      )
    }
  },
}
