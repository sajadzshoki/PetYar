import { and, asc, desc, eq, gt, inArray, sql } from 'drizzle-orm'
import { getDb } from '../db/client'
import {
  bookings,
  conversationParticipants,
  conversations,
  messages,
  providers,
  users,
} from '../db/schema'
import type { ConversationRow, MessageRow } from '../db/schema/messaging'
import { forbidden, notFound, validationError } from '../utils/errors'
import { logger } from '../utils/logger'
import { getObjectStorage } from '../storage'
import { mediaKey, mediaUrl } from '../utils/media'
import { notificationService } from './notification.service'
import type { Conversation, ConversationDetail, Message } from '../../shared/types/messaging'
import type { ConversationKind } from '../../shared/constants/messaging'

function pairKey(a: string, b: string) {
  return [a, b].sort().join(':')
}

function preview(body: string | null, hasFile: boolean) {
  if (body && body.trim()) return body.trim().slice(0, 80)
  if (hasFile) return 'تصویر'
  return null
}

async function namesFor(ids: string[]) {
  if (!ids.length) return new Map<string, string>()
  const db = getDb()
  const rows = await db.select({ id: users.id, displayName: users.displayName }).from(users).where(inArray(users.id, ids))
  return new Map(rows.map(r => [r.id, r.displayName]))
}

function toMessage(row: MessageRow, senderName: string): Message {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    senderName,
    body: row.body,
    attachmentUrl: mediaUrl(row.attachmentKey),
    createdAt: row.createdAt.toISOString(),
  }
}

async function requireParticipant(userId: string, conversationId: string) {
  const db = getDb()
  const [part] = await db.select().from(conversationParticipants).where(and(
    eq(conversationParticipants.conversationId, conversationId),
    eq(conversationParticipants.userId, userId),
  )).limit(1)
  if (!part) throw forbidden('شما عضو این گفتگو نیستید')
  const [convo] = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1)
  if (!convo) throw notFound('گفتگو یافت نشد')
  return { part, convo }
}

async function addParticipants(conversationId: string, userIds: string[]) {
  const db = getDb()
  for (const userId of userIds) {
    await db.insert(conversationParticipants).values({ conversationId, userId }).onConflictDoNothing()
  }
}

async function hydrateConversation(userId: string, row: ConversationRow): Promise<Conversation> {
  const db = getDb()
  const parts = await db.select().from(conversationParticipants).where(eq(conversationParticipants.conversationId, row.id))
  const nameMap = await namesFor(parts.map(p => p.userId))
  const mine = parts.find(p => p.userId === userId)
  const other = parts.find(p => p.userId !== userId)
  const [last] = await db.select().from(messages)
    .where(eq(messages.conversationId, row.id))
    .orderBy(desc(messages.createdAt))
    .limit(1)

  let unreadCount = 0
  if (mine) {
    const filters = [
      eq(messages.conversationId, row.id),
      sql`${messages.senderId} <> ${userId}`,
    ]
    if (mine.lastReadAt) filters.push(gt(messages.createdAt, mine.lastReadAt))
    const [countRow] = await db.select({ n: sql<number>`count(*)::int` }).from(messages).where(and(...filters))
    unreadCount = Number(countRow?.n || 0)
  }

  const title = other ? (nameMap.get(other.userId) || 'گفتگو') : 'گفتگو'
  return {
    id: row.id,
    kind: row.kind,
    bookingId: row.bookingId,
    providerId: row.providerId,
    title,
    lastMessageAt: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
    lastMessagePreview: last ? preview(last.body, Boolean(last.attachmentKey)) : null,
    unreadCount,
    participants: parts.map(p => ({
      userId: p.userId,
      displayName: nameMap.get(p.userId) || '',
      lastReadAt: p.lastReadAt ? p.lastReadAt.toISOString() : null,
    })),
    createdAt: row.createdAt.toISOString(),
  }
}

async function notifyOthers(conversationId: string, senderId: string, previewText: string) {
  const db = getDb()
  const parts = await db.select().from(conversationParticipants)
    .where(eq(conversationParticipants.conversationId, conversationId))
  for (const part of parts) {
    if (part.userId === senderId) continue
    await notificationService.notify({
      userId: part.userId,
      type: 'NEW_MESSAGE',
      title: 'پیام جدید',
      body: previewText,
      href: `/inbox/${conversationId}`,
      entityType: 'conversation',
      entityId: conversationId,
    })
  }
}

export const messagingService = {
  async listMine(userId: string): Promise<Conversation[]> {
    const db = getDb()
    const mine = await db.select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.userId, userId))
    if (!mine.length) return []
    const rows = await db.select().from(conversations)
      .where(inArray(conversations.id, mine.map(m => m.conversationId)))
      .orderBy(desc(conversations.lastMessageAt), desc(conversations.createdAt))
    return Promise.all(rows.map(row => hydrateConversation(userId, row)))
  },

  async getMine(userId: string, conversationId: string): Promise<ConversationDetail> {
    const { convo } = await requireParticipant(userId, conversationId)
    const summary = await hydrateConversation(userId, convo)
    const db = getDb()
    const rows = await db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))
      .limit(200)
    const nameMap = await namesFor([...new Set(rows.map(r => r.senderId))])
    return {
      ...summary,
      messages: rows.map(r => toMessage(r, nameMap.get(r.senderId) || '')),
    }
  },

  async openInquiry(userId: string, providerId: string): Promise<Conversation> {
    const db = getDb()
    const [provider] = await db.select().from(providers).where(eq(providers.id, providerId)).limit(1)
    if (!provider || !provider.isActive) throw notFound('ارائه‌دهنده یافت نشد')
    if (provider.userId === userId) throw forbidden('نمی‌توانید با خودتان گفتگو کنید')
    const key = pairKey(userId, provider.userId)
    const [existing] = await db.select().from(conversations).where(eq(conversations.pairKey, key)).limit(1)
    if (existing) return hydrateConversation(userId, existing)
    const [created] = await db.insert(conversations).values({
      kind: 'INQUIRY' as ConversationKind,
      providerId: provider.id,
      pairKey: key,
    }).returning()
    if (!created) throw new Error('Failed to create conversation')
    await addParticipants(created.id, [userId, provider.userId])
    logger.info('conversation_inquiry_opened', { conversationId: created.id, userId, providerId })
    return hydrateConversation(userId, created)
  },

  async ensureForBooking(bookingId: string): Promise<ConversationRow> {
    const db = getDb()
    const [existing] = await db.select().from(conversations).where(eq(conversations.bookingId, bookingId)).limit(1)
    if (existing) return existing
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1)
    if (!booking) throw notFound('رزرو یافت نشد')
    const [provider] = await db.select().from(providers).where(eq(providers.id, booking.providerId)).limit(1)
    if (!provider) throw notFound('ارائه‌دهنده یافت نشد')
    const [created] = await db.insert(conversations).values({
      kind: 'BOOKING',
      bookingId,
      providerId: provider.id,
    }).returning()
    if (!created) throw new Error('Failed to create booking conversation')
    await addParticipants(created.id, [booking.ownerId, provider.userId])
    return created
  },

  async send(userId: string, conversationId: string, body: string, attachmentKey?: string | null): Promise<Message> {
    await requireParticipant(userId, conversationId)
    const text = body.trim()
    if (!text && !attachmentKey) {
      throw validationError({ field: 'body' }, 'پیام خالی است')
    }
    const db = getDb()
    const [row] = await db.insert(messages).values({
      conversationId,
      senderId: userId,
      body: text || null,
      attachmentKey: attachmentKey || null,
    }).returning()
    if (!row) throw new Error('Failed to send message')
    await db.update(conversations).set({
      lastMessageAt: row.createdAt,
      updatedAt: new Date(),
    }).where(eq(conversations.id, conversationId))
    await db.update(conversationParticipants).set({
      lastReadAt: row.createdAt,
    }).where(and(
      eq(conversationParticipants.conversationId, conversationId),
      eq(conversationParticipants.userId, userId),
    ))
    const [sender] = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, userId)).limit(1)
    await notifyOthers(conversationId, userId, preview(text, Boolean(attachmentKey)) || 'پیام جدید')
    logger.info('message_sent', { messageId: row.id, conversationId })
    return toMessage(row, sender?.displayName || '')
  },

  async markRead(userId: string, conversationId: string) {
    await requireParticipant(userId, conversationId)
    const db = getDb()
    await db.update(conversationParticipants).set({ lastReadAt: new Date() }).where(and(
      eq(conversationParticipants.conversationId, conversationId),
      eq(conversationParticipants.userId, userId),
    ))
    return { ok: true }
  },

  async attach(userId: string, conversationId: string, file: Buffer, contentType: string, caption?: string) {
    await requireParticipant(userId, conversationId)
    const key = mediaKey(`messages/${conversationId}`, contentType)
    await getObjectStorage().put(key, file, contentType)
    return this.send(userId, conversationId, caption || '', key)
  },

  async canAccessAttachment(userId: string, key: string): Promise<boolean> {
    const match = key.match(/^messages\/([0-9a-f-]{36})\//i)
    if (!match?.[1]) return false
    const db = getDb()
    const [part] = await db.select({ id: conversationParticipants.id }).from(conversationParticipants).where(and(
      eq(conversationParticipants.conversationId, match[1]),
      eq(conversationParticipants.userId, userId),
    )).limit(1)
    return Boolean(part)
  },
}
