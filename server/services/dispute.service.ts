import { desc, eq } from 'drizzle-orm'
import { getDb } from '../db/client'
import { bookings, disputes, users } from '../db/schema'
import type { DisputeRow } from '../db/schema/moderation'
import type { BookingDispute } from '../../shared/types/moderation'
import type { DisputeResolution } from '../../shared/constants/moderation'
import { conflict, notFound } from '../utils/errors'
import { auditService } from './audit.service'
import { requireAdminActor } from '../utils/admin-actor'
import { notificationService } from './notification.service'
import type { BookingStatus } from '../../shared/constants/bookings'

function toDispute(row: DisputeRow, openerName: string): BookingDispute {
  return {
    id: row.id,
    bookingId: row.bookingId,
    openedByUserId: row.openedByUserId,
    openerName,
    reason: row.reason,
    status: row.status,
    previousStatus: row.previousStatus,
    resolution: row.resolution,
    adminNote: row.adminNote,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
  }
}

export const disputeService = {
  async open(userId: string, bookingId: string, reason: string, previousStatus: string) {
    const db = getDb()
    const openRows = await db.select().from(disputes)
      .where(eq(disputes.bookingId, bookingId))
    if (openRows.some(r => r.status === 'OPEN' || r.status === 'IN_REVIEW')) {
      throw conflict('برای این رزرو اختلاف باز وجود دارد')
    }
    const [row] = await db.insert(disputes).values({
      bookingId,
      openedByUserId: userId,
      reason,
      previousStatus,
    }).returning()
    if (!row) throw new Error('Failed to open dispute')
    await auditService.record({
      actorId: userId,
      action: 'dispute.open',
      entityType: 'dispute',
      entityId: row.id,
      metadata: { bookingId },
    })
    const [opener] = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, userId)).limit(1)
    return toDispute(row, opener?.displayName || '')
  },

  async listAll(): Promise<BookingDispute[]> {
    const db = getDb()
    const rows = await db.select({
      dispute: disputes,
      name: users.displayName,
    }).from(disputes)
      .innerJoin(users, eq(users.id, disputes.openedByUserId))
      .orderBy(desc(disputes.createdAt))
      .limit(80)
    return rows.map(r => toDispute(r.dispute, r.name))
  },

  async require(id: string): Promise<BookingDispute> {
    const db = getDb()
    const [row] = await db.select({
      dispute: disputes,
      name: users.displayName,
    }).from(disputes)
      .innerJoin(users, eq(users.id, disputes.openedByUserId))
      .where(eq(disputes.id, id))
      .limit(1)
    if (!row) throw notFound('اختلاف یافت نشد')
    return toDispute(row.dispute, row.name)
  },

  async resolve(adminId: string, id: string, resolution: DisputeResolution, note: string) {
    await requireAdminActor(adminId)
    const current = await this.require(id)
    if (current.status === 'RESOLVED' || current.status === 'DISMISSED') {
      throw conflict('این اختلاف بسته شده است')
    }
    const db = getDb()
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, current.bookingId)).limit(1)
    if (!booking) throw notFound('رزرو یافت نشد')

    let nextStatus: BookingStatus | null = null
    if (resolution === 'CANCEL_BOOKING') nextStatus = 'CANCELLED'
    else if (resolution === 'COMPLETE_BOOKING') nextStatus = 'COMPLETED'
    else if (resolution === 'UPHOLD') nextStatus = current.previousStatus as BookingStatus

    if (nextStatus) {
      await db.update(bookings).set({
        status: nextStatus,
        updatedAt: new Date(),
        cancellationReason: resolution === 'CANCEL_BOOKING' ? note : booking.cancellationReason,
      }).where(eq(bookings.id, booking.id))
    }

    await db.update(disputes).set({
      status: 'RESOLVED',
      resolution,
      adminNote: note,
      resolvedBy: adminId,
      resolvedAt: new Date(),
    }).where(eq(disputes.id, id))

    await auditService.record({
      actorId: adminId,
      action: 'dispute.resolve',
      entityType: 'dispute',
      entityId: id,
      metadata: { resolution, bookingId: booking.id },
    })

    await notificationService.notify({
      userId: current.openedByUserId,
      type: 'DISPUTE_UPDATE',
      title: 'نتیجه اختلاف',
      body: 'اختلاف رزرو بررسی شد.',
      href: `/bookings/${booking.id}`,
      entityType: 'dispute',
      entityId: id,
    })

    return this.require(id)
  },
}
