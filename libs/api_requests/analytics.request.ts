import { CreateTransactionSchema } from '@/dto/analytics.dto';
import { apiResponse, httpRequest } from '../api.helpers';

const api = httpRequest();

export const analyticsRequest = {
  createTransaction: async (transaction: CreateTransactionSchema) => {
    try {
      const response = await api.post(`/analytics/transaction`, transaction);
      return apiResponse(
        true,
        'Transaction record created',
        response.data.data
      );
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error adding address book entry',
        err
      );
    }
  },
};
