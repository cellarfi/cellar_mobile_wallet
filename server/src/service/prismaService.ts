import { PrismaClient } from '../../generated/prisma'

export class PrismaService {
  private static instance: PrismaService
  public prisma: PrismaClient

  private constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    })
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService()
    }
    return PrismaService.instance
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect()
      console.log('Prisma database connection successful')
    } catch (error) {
      console.error('Prisma database connection failed:', error)
      throw error
    }
  }

  public async testConnection(): Promise<void> {
    try {
      // Test the connection with a simple query
      await this.prisma.$queryRaw`SELECT 1 as result`
      console.log('Prisma database connection test successful')
    } catch (error) {
      console.error('Prisma database connection test failed:', error)
      console.warn('Proceeding without a successful DB connection.')
    }
  }

  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
    console.log('Prisma database connection closed')
  }

  public async onShutdown(): Promise<void> {
    await this.disconnect()
  }
}

// Export a singleton instance
export const prismaService = PrismaService.getInstance()
export default prismaService
