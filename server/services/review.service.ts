import { and, avg, count, desc, eq, sql } from 'drizzle-orm'
import { getDb } from '../db/client'
import { bookings, favorites, providers, reviews, users } from '../db/schema'
import type { ReviewRow } from '../db/schema/reviews'
import { conflict, forbidden, notFound } from '../utils/errors'
import { logger } from '../utils/logger'
import { mediaUrl } from '../utils/media'
import type { FavoriteProvider, ProviderRatingSummary, Review } from '../../shared/types/review'
import type { ReviewWriteInput } from '../../shared/validation/review'

const emptyRating = (): ProviderRatingSummary => ({
  overall: 0,
  communication: 0,
  quality: 0,
  punctuality: 0,
  care: 0,
  reviewCount: 0,
})

function roundAvg(value: string | number | null | undefined): number {
  if (value == null) return 0
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 10) / 10
}

function toReview(row: ReviewRow, ownerName: string): Review {
  return {
    id: row.id,
    bookingId: row.bookingId,
    providerId: row.providerId,
    ownerId: row.ownerId,
    ownerName,
    overall: row.overall,
    communication: row.communication,
    quality: row.quality,
    punctuality: row.punctuality,
    care: row.care,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
  }
}

export const reviewService = {
  async summaryForProvider(providerId: string): Promise<ProviderRatingSummary> {
    const db = getDb()
    const [row] = await db.select({
      reviewCount: count(),
      overall: avg(reviews.overall),
      communication: avg(reviews.communication),
      quality: avg(reviews.quality),
      punctuality: avg(reviews.punctuality),
      care: avg(reviews.care),
    }).from(reviews).where(eq(reviews.providerId, providerId))
    const reviewCount = Number(row?.reviewCount || 0)
    if (!reviewCount) return emptyRating()
    return {
      reviewCount,
      overall: roundAvg(row?.overall),
      communication: roundAvg(row?.communication),
      quality: roundAvg(row?.quality),
      punctuality: roundAvg(row?.punctuality),
      care: roundAvg(row?.care),
    }
  },

  async listForProvider(providerId: string): Promise<Review[]> {
    const db = getDb()
    const rows = await db.select({
      review: reviews,
      ownerName: users.displayName,
    }).from(reviews)
      .innerJoin(users, eq(users.id, reviews.ownerId))
      .where(eq(reviews.providerId, providerId))
      .orderBy(desc(reviews.createdAt))
      .limit(50)
    return rows.map(r => toReview(r.review, r.ownerName))
  },

  async getForBooking(bookingId: string): Promise<Review | null> {
    const db = getDb()
    const [row] = await db.select().from(reviews).where(eq(reviews.bookingId, bookingId)).limit(1)
    if (!row) return null
    const [owner] = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, row.ownerId)).limit(1)
    return toReview(row, owner?.displayName || '')
  },

  async createForOwner(userId: string, bookingId: string, input: ReviewWriteInput): Promise<Review> {
    const db = getDb()
    const created = await db.transaction(async (tx) => {
      const hex = bookingId.replace(/-/g, '').slice(0, 8)
      const lock = Number.parseInt(hex, 16) % 2147483647
      await tx.execute(sql`select pg_advisory_xact_lock(${lock})`)
      const [booking] = await tx.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1)
      if (!booking) throw notFound('رزرو یافت نشد')
      if (booking.ownerId !== userId) throw forbidden()
      if (booking.status !== 'COMPLETED') {
        throw conflict('فقط پس از اتمام خدمت می‌توان نظر ثبت کرد')
      }
      const [existing] = await tx.select({ id: reviews.id }).from(reviews).where(eq(reviews.bookingId, bookingId)).limit(1)
      if (existing) throw conflict('برای این رزرو قبلاً نظر ثبت شده است')
      const [row] = await tx.insert(reviews).values({
        bookingId,
        ownerId: userId,
        providerId: booking.providerId,
        overall: input.overall,
        communication: input.communication,
        quality: input.quality,
        punctuality: input.punctuality,
        care: input.care,
        comment: input.comment.trim(),
      }).returning()
      if (!row) throw new Error('Failed to create review')
      return row
    })
    logger.info('review_created', { reviewId: created.id, bookingId, providerId: created.providerId })
    const [owner] = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, userId)).limit(1)
    return toReview(created, owner?.displayName || '')
  },

  async isFavorite(userId: string, providerId: string): Promise<boolean> {
    const db = getDb()
    const [row] = await db.select({ id: favorites.id }).from(favorites).where(and(
      eq(favorites.userId, userId),
      eq(favorites.providerId, providerId),
    )).limit(1)
    return Boolean(row)
  },

  async listFavorites(userId: string): Promise<FavoriteProvider[]> {
    const db = getDb()
    const rows = await db.select({
      providerId: favorites.providerId,
      displayName: providers.displayName,
      photoKey: providers.photoKey,
      city: providers.city,
      createdAt: favorites.createdAt,
    }).from(favorites)
      .innerJoin(providers, eq(providers.id, favorites.providerId))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt))

    const result: FavoriteProvider[] = []
    for (const row of rows) {
      const rating = await this.summaryForProvider(row.providerId)
      result.push({
        providerId: row.providerId,
        displayName: row.displayName,
        photoUrl: mediaUrl(row.photoKey),
        city: row.city,
        ratingAverage: rating.reviewCount ? rating.overall : null,
        reviewCount: rating.reviewCount,
        createdAt: row.createdAt.toISOString(),
      })
    }
    return result
  },

  async addFavorite(userId: string, providerId: string) {
    const db = getDb()
    const [provider] = await db.select().from(providers).where(eq(providers.id, providerId)).limit(1)
    if (!provider || !provider.isActive) throw notFound('ارائه‌دهنده یافت نشد')
    if (provider.userId === userId) throw forbidden('نمی‌توانید خودتان را ذخیره کنید')
    const [existing] = await db.select().from(favorites).where(and(
      eq(favorites.userId, userId),
      eq(favorites.providerId, providerId),
    )).limit(1)
    if (existing) return { favorited: true }
    await db.insert(favorites).values({ userId, providerId })
    logger.info('favorite_added', { userId, providerId })
    return { favorited: true }
  },

  async removeFavorite(userId: string, providerId: string) {
    const db = getDb()
    await db.delete(favorites).where(and(
      eq(favorites.userId, userId),
      eq(favorites.providerId, providerId),
    ))
    return { favorited: false }
  },
}
