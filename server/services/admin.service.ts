import { desc, eq, ilike, or, sql } from 'drizzle-orm'
import { getDb } from '../db/client'
import { bookings, pets, providerServices, providers, reviews, users } from '../db/schema'
import { forbidden, notFound } from '../utils/errors'
import { requireAdminActor } from '../utils/admin-actor'
import { auditService } from './audit.service'
import { notificationService } from './notification.service'
import type { AdminReview, AdminUser } from '../../shared/types/moderation'
import type { UserStatus } from '../../shared/constants/moderation'

function toAdminUser(row: typeof users.$inferSelect): AdminUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }
}

export const adminService = {
  async listUsers(query?: string): Promise<AdminUser[]> {
    const db = getDb()
    const q = query?.trim()
    const rows = q
      ? await db.select().from(users).where(or(
          ilike(users.email, `%${q}%`),
          ilike(users.displayName, `%${q}%`),
        )).orderBy(desc(users.createdAt)).limit(80)
      : await db.select().from(users).orderBy(desc(users.createdAt)).limit(80)
    return rows.map(toAdminUser)
  },

  async getUser(id: string): Promise<AdminUser> {
    const db = getDb()
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1)
    if (!row) throw notFound('کاربر یافت نشد')
    return toAdminUser(row)
  },

  async setUserStatus(adminId: string, userId: string, status: UserStatus, reason: string) {
    await requireAdminActor(adminId)
    if (adminId === userId) throw forbidden('نمی‌توانید وضعیت حساب خود را تغییر دهید')
    const db = getDb()
    const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!row) throw notFound('کاربر یافت نشد')
    if (row.role === 'ADMIN' && status !== 'ACTIVE') {
      throw forbidden('مسدود کردن حساب مدیر مجاز نیست')
    }
    const [updated] = await db.update(users).set({
      status,
      updatedAt: new Date(),
    }).where(eq(users.id, userId)).returning()
    if (!updated) throw notFound()
    if (status !== 'ACTIVE') {
      await db.update(providers).set({ isActive: false, updatedAt: new Date() }).where(eq(providers.userId, userId))
    }
    await auditService.record({
      actorId: adminId,
      action: `user.${status.toLowerCase()}`,
      entityType: 'user',
      entityId: userId,
      metadata: { reason },
    })
    await notificationService.notify({
      userId,
      type: 'ACCOUNT_STATUS',
      title: 'وضعیت حساب',
      body: status === 'ACTIVE' ? 'حساب شما فعال شد.' : status === 'SUSPENDED' ? 'حساب شما مسدود شد.' : 'حساب شما غیرفعال شد.',
      href: '/account',
      entityType: 'user',
      entityId: userId,
    })
    return toAdminUser(updated)
  },

  async listProviders() {
    const db = getDb()
    const rows = await db.select({
      provider: providers,
      email: users.email,
      userStatus: users.status,
    }).from(providers)
      .innerJoin(users, eq(users.id, providers.userId))
      .orderBy(desc(providers.createdAt))
      .limit(80)
    return rows.map(r => ({
      id: r.provider.id,
      userId: r.provider.userId,
      displayName: r.provider.displayName,
      city: r.provider.city,
      isActive: r.provider.isActive,
      verificationStatus: r.provider.verificationStatus,
      verified: r.provider.verificationStatus === 'APPROVED',
      email: r.email,
      userStatus: r.userStatus,
      createdAt: r.provider.createdAt.toISOString(),
    }))
  },

  async getProvider(id: string) {
    const list = await this.listProviders()
    const row = list.find(p => p.id === id)
    if (!row) throw notFound('ارائه‌دهنده یافت نشد')
    return row
  },

  async setProviderActive(adminId: string, providerId: string, isActive: boolean, reason: string) {
    await requireAdminActor(adminId)
    const db = getDb()
    const [row] = await db.update(providers).set({
      isActive,
      updatedAt: new Date(),
    }).where(eq(providers.id, providerId)).returning()
    if (!row) throw notFound('ارائه‌دهنده یافت نشد')
    await auditService.record({
      actorId: adminId,
      action: isActive ? 'provider.activate' : 'provider.deactivate',
      entityType: 'provider',
      entityId: providerId,
      metadata: { reason },
    })
    return this.getProvider(providerId)
  },

  async listBookings() {
    const db = getDb()
    const rows = await db.select({
      booking: bookings,
      ownerName: users.displayName,
      petName: pets.name,
      providerName: providers.displayName,
      serviceTitle: providerServices.title,
    }).from(bookings)
      .innerJoin(users, eq(users.id, bookings.ownerId))
      .innerJoin(pets, eq(pets.id, bookings.petId))
      .innerJoin(providers, eq(providers.id, bookings.providerId))
      .innerJoin(providerServices, eq(providerServices.id, bookings.serviceId))
      .orderBy(desc(bookings.createdAt))
      .limit(80)
    return rows.map(r => ({
      id: r.booking.id,
      status: r.booking.status,
      ownerName: r.ownerName,
      petName: r.petName,
      providerName: r.providerName,
      serviceTitle: r.serviceTitle,
      startAt: r.booking.startAt.toISOString(),
      totalAmount: r.booking.totalAmount,
      createdAt: r.booking.createdAt.toISOString(),
    }))
  },

  async getBooking(id: string) {
    const items = await this.listBookings()
    const row = items.find(b => b.id === id)
    if (!row) throw notFound('رزرو یافت نشد')
    return row
  },

  async listReviews(): Promise<AdminReview[]> {
    const db = getDb()
    const rows = await db.select({
      review: reviews,
      ownerName: users.displayName,
    }).from(reviews)
      .innerJoin(users, eq(users.id, reviews.ownerId))
      .orderBy(desc(reviews.createdAt))
      .limit(80)
    return rows.map(r => ({
      id: r.review.id,
      bookingId: r.review.bookingId,
      providerId: r.review.providerId,
      ownerId: r.review.ownerId,
      ownerName: r.ownerName,
      comment: r.review.comment,
      overall: r.review.overall,
      hidden: Boolean(r.review.hiddenAt),
      createdAt: r.review.createdAt.toISOString(),
    }))
  },

  async hideReview(adminId: string, reviewId: string, reason: string) {
    await requireAdminActor(adminId)
    const db = getDb()
    const [row] = await db.update(reviews).set({
      hiddenAt: new Date(),
      hiddenBy: adminId,
      hideReason: reason,
    }).where(eq(reviews.id, reviewId)).returning()
    if (!row) throw notFound('نظر یافت نشد')
    await auditService.record({
      actorId: adminId,
      action: 'review.hide',
      entityType: 'review',
      entityId: reviewId,
      metadata: { reason },
    })
    return this.listReviews().then(list => list.find(r => r.id === reviewId)!)
  },

  async restoreReview(adminId: string, reviewId: string) {
    await requireAdminActor(adminId)
    const db = getDb()
    const [row] = await db.update(reviews).set({
      hiddenAt: null,
      hiddenBy: null,
      hideReason: null,
    }).where(eq(reviews.id, reviewId)).returning()
    if (!row) throw notFound('نظر یافت نشد')
    await auditService.record({
      actorId: adminId,
      action: 'review.restore',
      entityType: 'review',
      entityId: reviewId,
    })
    return this.listReviews().then(list => list.find(r => r.id === reviewId)!)
  },

  async overview() {
    const db = getDb()
    const [counts] = await db.select({
      users: sql<number>`(select count(*) from users)`,
      providers: sql<number>`(select count(*) from providers)`,
      openReports: sql<number>`(select count(*) from reports where status in ('OPEN','IN_REVIEW'))`,
      openDisputes: sql<number>`(select count(*) from disputes where status in ('OPEN','IN_REVIEW'))`,
      pendingVerifications: sql<number>`(select count(*) from verification_applications where status = 'PENDING')`,
    }).from(users).limit(1)
    return {
      users: Number(counts?.users || 0),
      providers: Number(counts?.providers || 0),
      openReports: Number(counts?.openReports || 0),
      openDisputes: Number(counts?.openDisputes || 0),
      pendingVerifications: Number(counts?.pendingVerifications || 0),
    }
  },
}
