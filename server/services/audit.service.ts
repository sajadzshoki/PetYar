import { desc, eq } from 'drizzle-orm'
import { getDb } from '../db/client'
import { auditLogs, users } from '../db/schema'
import type { AuditLogEntry } from '../../shared/types/moderation'
import { logger } from '../utils/logger'

export interface AuditInput {
  actorId: string | null
  action: string
  entityType: string
  entityId?: string | null
  metadata?: Record<string, unknown> | null
}

function toEntry(row: typeof auditLogs.$inferSelect, actorName: string): AuditLogEntry {
  return {
    id: row.id,
    actorId: row.actorId,
    actorName,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

export const auditService = {
  async record(input: AuditInput) {
    const db = getDb()
    const [row] = await db.insert(auditLogs).values({
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || null,
      metadata: input.metadata || null,
    }).returning()
    logger.info('audit', { action: input.action, actorId: input.actorId, entityType: input.entityType, entityId: input.entityId })
    return row
  },

  async list(limit = 80): Promise<AuditLogEntry[]> {
    const db = getDb()
    const rows = await db.select({
      log: auditLogs,
      actorName: users.displayName,
    }).from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
    return rows.map(r => toEntry(r.log, r.actorName || 'سیستم'))
  },
}
