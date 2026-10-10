import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { getDb } from '../db/client'
import { notifications } from '../db/schema'
import type { NotificationRow } from '../db/schema/notifications'
import { logger } from '../utils/logger'
import type { NotificationType } from '../../shared/constants/notifications'
import type { AppNotification } from '../../shared/types/notification'
import { forbidden, notFound } from '../utils/errors'

export interface NotifyInput {
  userId: string
  type: NotificationType
  title: string
  body: string
  href?: string | null
  entityType?: string | null
  entityId?: string | null
}

function toNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    entityType: row.entityType,
    entityId: row.entityId,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }
}

/**
 * Persistent notifications. Realtime (SSE/WebSocket) can subscribe to `create`
 * without changing this domain.
 */
export const notificationService = {
  async create(input: NotifyInput): Promise<AppNotification> {
    const db = getDb()
    const [row] = await db.insert(notifications).values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href || null,
      entityType: input.entityType || null,
      entityId: input.entityId || null,
    }).returning()
    if (!row) throw new Error('Failed to create notification')
    logger.info('notification_created', { id: row.id, type: input.type, userId: input.userId })
    return toNotification(row)
  },

  async notify(input: NotifyInput) {
    try {
      return await this.create(input)
    }
    catch (error) {
      logger.error('notification_failed', {
        message: error instanceof Error ? error.message : String(error),
        type: input.type,
      })
      return null
    }
  },

  async list(userId: string, unreadOnly = false): Promise<AppNotification[]> {
    const db = getDb()
    const filters = [eq(notifications.userId, userId)]
    if (unreadOnly) filters.push(isNull(notifications.readAt))
    const rows = await db.select().from(notifications)
      .where(and(...filters))
      .orderBy(desc(notifications.createdAt))
      .limit(80)
    return rows.map(toNotification)
  },

  async unreadCount(userId: string): Promise<number> {
    const db = getDb()
    const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    return Number(row?.n || 0)
  },

  async markRead(userId: string, id: string) {
    const db = getDb()
    const [row] = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1)
    if (!row) throw notFound('اعلان یافت نشد')
    if (row.userId !== userId) throw forbidden()
    if (row.readAt) return toNotification(row)
    const [updated] = await db.update(notifications).set({
      readAt: new Date(),
    }).where(eq(notifications.id, id)).returning()
    return toNotification(updated || row)
  },

  async markAllRead(userId: string) {
    const db = getDb()
    await db.update(notifications).set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    return { ok: true }
  },
}
