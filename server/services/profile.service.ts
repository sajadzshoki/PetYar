import { eq } from 'drizzle-orm'
import { getDb } from '../db/client'
import { users } from '../db/schema'
import type { UserRow } from '../db/schema/users'
import type { PublicUser, SessionUser } from '../../shared/types/user'
import type { ProfileUpdateInput } from '../../shared/validation/profile'
import { notFound } from '../utils/errors'
import { getObjectStorage } from '../storage'
import { mediaKey, mediaUrl } from '../utils/media'
import { logger } from '../utils/logger'

function displayNameFrom(firstName: string, lastName: string, fallback: string) {
  const joined = `${firstName} ${lastName}`.trim()
  return joined || fallback
}

export function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    phone: user.phone,
    bio: user.bio,
    avatarUrl: mediaUrl(user.avatarKey),
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  }
}

export function toSessionUser(user: UserRow): SessionUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  }
}

export const profileService = {
  async getById(id: string): Promise<PublicUser> {
    const db = getDb()
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
    if (!user) throw notFound('کاربر یافت نشد')
    return toPublicUser(user)
  },

  async update(userId: string, input: ProfileUpdateInput) {
    const db = getDb()
    const firstName = input.firstName
    const lastName = input.lastName ?? ''
    const phone = input.phone ? input.phone.trim() : null
    const bio = input.bio ? input.bio.trim() : null
    const displayName = displayNameFrom(firstName, lastName, firstName)

    const [updated] = await db.update(users).set({
      firstName,
      lastName,
      phone,
      bio,
      displayName,
      updatedAt: new Date(),
    }).where(eq(users.id, userId)).returning()

    if (!updated) throw notFound('کاربر یافت نشد')
    logger.info('profile_updated', { userId })
    return { publicUser: toPublicUser(updated), sessionUser: toSessionUser(updated) }
  },

  async setAvatar(userId: string, body: Buffer, contentType: string) {
    const db = getDb()
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) throw notFound('کاربر یافت نشد')

    const storage = getObjectStorage()
    if (user.avatarKey) {
      await storage.delete(user.avatarKey)
    }
    const key = mediaKey(`avatars/${userId}`, contentType)
    await storage.put(key, body, contentType)

    const [updated] = await db.update(users).set({
      avatarKey: key,
      updatedAt: new Date(),
    }).where(eq(users.id, userId)).returning()

    if (!updated) throw notFound('کاربر یافت نشد')
    logger.info('avatar_updated', { userId })
    return toPublicUser(updated)
  },
}
