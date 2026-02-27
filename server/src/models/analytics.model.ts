import { prismaService } from '../service/prismaService';
import { CreateTransactionSchema } from '@/utils/dto/analytics.dto';
import { Transaction } from '../../generated/prisma';
import { isStablecoin } from '@/utils/solana.util';
import { PriceService } from '@/services/priceService';

const prisma = prismaService.prisma;

export class AnalyticsModel {
  static async createTransaction(
    transaction: CreateTransactionSchema
  ): Promise<Transaction | null> {
    const { token_address, amount } = transaction;

    let amount_usd: number;

    if (isStablecoin(token_address)) {
      // If stablecoin, use the amount as-is (assume amount is already in USD)
      amount_usd = this.parseAmount(amount);
    } else {
      // If not a stablecoin, fetch price and convert to USD
      const price = await PriceService.fetchPrice(token_address);
      amount_usd = this.parseAmount(amount) * price;
    }

    return prisma.transaction.create({
      data: {
        ...transaction,
        amount: amount_usd,
      },
    });
  }

  private static parseAmount(amount: string | number): number {
    return typeof amount === 'string' ? parseFloat(amount) : amount;
  }
}
