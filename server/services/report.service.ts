import { desc, eq } from 'drizzle-orm'
import { getDb } from '../db/client'
import { bookings, providers, reports, reviews, users } from '../db/schema'
import type { ReportRow } from '../db/schema/moderation'
import type { SafetyReport } from '../../shared/types/moderation'
import type { ReportCreateInput } from '../../shared/validation/moderation'
import { conflict, forbidden, notFound } from '../utils/errors'
import { auditService } from './audit.service'
import { notificationService } from './notification.service'

function toReport(row: ReportRow, reporterName: string): SafetyReport {
  return {
    id: row.id,
    reporterId: row.reporterId,
    reporterName,
    targetType: row.targetType,
    targetId: row.targetId,
    reason: row.reason,
    description: row.description,
    status: row.status,
    resolutionNote: row.resolutionNote,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
  }
}

export const reportService = {
  async create(userId: string, input: ReportCreateInput): Promise<SafetyReport> {
    const db = getDb()
    if (input.targetType === 'USER') {
      const [u] = await db.select({ id: users.id }).from(users).where(eq(users.id, input.targetId)).limit(1)
      if (!u) throw notFound('کاربر یافت نشد')
      if (u.id === userId) throw forbidden('نمی‌توانید خودتان را گزارش کنید')
    }
    else if (input.targetType === 'PROVIDER') {
      const [p] = await db.select({ id: providers.id }).from(providers).where(eq(providers.id, input.targetId)).limit(1)
      if (!p) throw notFound('ارائه‌دهنده یافت نشد')
    }
    else if (input.targetType === 'BOOKING') {
      const [b] = await db.select().from(bookings).where(eq(bookings.id, input.targetId)).limit(1)
      if (!b) throw notFound('رزرو یافت نشد')
      if (b.ownerId !== userId) {
        const [p] = await db.select().from(providers).where(eq(providers.id, b.providerId)).limit(1)
        if (!p || p.userId !== userId) throw forbidden()
      }
    }
    else if (input.targetType === 'REVIEW') {
      const [r] = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.id, input.targetId)).limit(1)
      if (!r) throw notFound('نظر یافت نشد')
    }
    const [row] = await db.insert(reports).values({
      reporterId: userId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      description: input.description,
    }).returning()
    if (!row) throw new Error('Failed to create report')
    await auditService.record({
      actorId: userId,
      action: 'report.create',
      entityType: 'report',
      entityId: row.id,
      metadata: { targetType: input.targetType, targetId: input.targetId },
    })
    const [reporter] = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, userId)).limit(1)
    return toReport(row, reporter?.displayName || '')
  },

  async listMine(userId: string): Promise<SafetyReport[]> {
    const db = getDb()
    const rows = await db.select({
      report: reports,
      name: users.displayName,
    }).from(reports)
      .innerJoin(users, eq(users.id, reports.reporterId))
      .where(eq(reports.reporterId, userId))
      .orderBy(desc(reports.createdAt))
      .limit(50)
    return rows.map(r => toReport(r.report, r.name))
  },

  async listAll(): Promise<SafetyReport[]> {
    const db = getDb()
    const rows = await db.select({
      report: reports,
      name: users.displayName,
    }).from(reports)
      .innerJoin(users, eq(users.id, reports.reporterId))
      .orderBy(desc(reports.createdAt))
      .limit(80)
    return rows.map(r => toReport(r.report, r.name))
  },

  async require(id: string): Promise<SafetyReport> {
    const db = getDb()
    const [row] = await db.select({
      report: reports,
      name: users.displayName,
    }).from(reports)
      .innerJoin(users, eq(users.id, reports.reporterId))
      .where(eq(reports.id, id))
      .limit(1)
    if (!row) throw notFound('گزارش یافت نشد')
    return toReport(row.report, row.name)
  },

  async setStatus(adminId: string, id: string, status: 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED', note: string) {
    const current = await this.require(id)
    if (current.status === 'RESOLVED' || current.status === 'DISMISSED') {
      throw conflict('این گزارش بسته شده است')
    }
    const db = getDb()
    const [row] = await db.update(reports).set({
      status,
      resolutionNote: note,
      resolvedBy: status === 'IN_REVIEW' ? null : adminId,
      resolvedAt: status === 'IN_REVIEW' ? null : new Date(),
    }).where(eq(reports.id, id)).returning()
    if (!row) throw notFound()
    await auditService.record({
      actorId: adminId,
      action: `report.${status.toLowerCase()}`,
      entityType: 'report',
      entityId: id,
    })
    if (status !== 'IN_REVIEW') {
      await notificationService.notify({
        userId: current.reporterId,
        type: 'REPORT_UPDATE',
        title: 'وضعیت گزارش',
        body: status === 'RESOLVED' ? 'گزارش شما رسیدگی شد.' : 'گزارش شما بسته شد.',
        href: '/account',
        entityType: 'report',
        entityId: id,
      })
    }
    return this.require(id)
  },
}
