import prismaService from '@/service/prismaService'
import { ReportStatus, ReportType } from '../../generated/prisma'

const prisma = prismaService.prisma

export interface CreateReportDto {
  reporter_id: string
  target_type: ReportType
  target_id: string
  reason: string
}

export class ReportModel {
  /**
   * Create a new report for a post or user
   */
  static async createReport(dto: CreateReportDto) {
    return prisma.report.create({
      data: {
        reporter_id: dto.reporter_id,
        target_type: dto.target_type,
        target_id: dto.target_id,
        reason: dto.reason,
      },
    })
  }

  /**
   * Check if user has already reported this target
   */
  static async hasReported(
    reporterId: string,
    targetType: ReportType,
    targetId: string
  ): Promise<boolean> {
    const report = await prisma.report.findFirst({
      where: {
        reporter_id: reporterId,
        target_type: targetType,
        target_id: targetId,
      },
    })
    return !!report
  }

  /**
   * Get reports submitted by a user
   */
  static async getReportsByUser(reporterId: string) {
    return prisma.report.findMany({
      where: {
        reporter_id: reporterId,
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  /**
   * Get all pending reports (for admin moderation)
   */
  static async getPendingReports() {
    return prisma.report.findMany({
      where: {
        status: ReportStatus.PENDING,
      },
      orderBy: {
        created_at: 'asc',
      },
    })
  }

  /**
   * Get reports for a specific post
   */
  static async getReportsForPost(postId: string) {
    return prisma.report.findMany({
      where: {
        target_type: ReportType.POST,
        target_id: postId,
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  /**
   * Get reports for a specific user
   */
  static async getReportsForUser(userId: string) {
    return prisma.report.findMany({
      where: {
        target_type: ReportType.USER,
        target_id: userId,
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  /**
   * Update report status
   */
  static async updateReportStatus(reportId: string, status: ReportStatus) {
    return prisma.report.update({
      where: {
        id: reportId,
      },
      data: {
        status,
      },
    })
  }

  /**
   * Get report count for a target (useful for auto-moderation thresholds)
   */
  static async getReportCount(
    targetType: ReportType,
    targetId: string
  ): Promise<number> {
    return prisma.report.count({
      where: {
        target_type: targetType,
        target_id: targetId,
        status: ReportStatus.PENDING,
      },
    })
  }
}
