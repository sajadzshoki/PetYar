import { and, asc, desc, eq } from 'drizzle-orm'
import { getDb } from '../db/client'
import { providerGallery, providerServices, providers, serviceCategories, users } from '../db/schema'
import type { CategoryRow, GalleryRow, ProviderRow, ProviderServiceRow } from '../db/schema/providers'
import type { ProviderProfile, ProviderService, PublicProvider, ServiceCategory } from '../../shared/types/provider'
import type { ProviderServiceWriteInput, ProviderWriteInput } from '../../shared/validation/provider'
import { conflict, forbidden, notFound, validationError } from '../utils/errors'
import { getObjectStorage } from '../storage'
import { mediaKey, mediaUrl } from '../utils/media'
import { logger } from '../utils/logger'
import { MAX_GALLERY_IMAGES } from '../../shared/constants/providers'
import { toSessionUser } from './profile.service'
import type { SessionUser } from '../../shared/types/user'

function emptyToNull(value?: string | null) {
  if (!value) return null
  const t = value.trim()
  return t.length ? t : null
}

function num(value: string | null): number | null {
  if (value === null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toCategory(row: CategoryRow): ServiceCategory {
  return { id: row.id, slug: row.slug, name: row.name, sortOrder: row.sortOrder }
}

function toGallery(row: GalleryRow) {
  return { id: row.id, imageUrl: mediaUrl(row.imageKey)! }
}

function toService(row: ProviderServiceRow, categoryName: string): ProviderService {
  return {
    id: row.id,
    categoryId: row.categoryId,
    categoryName,
    title: row.title,
    description: row.description,
    pricingType: row.pricingType,
    price: num(row.price),
    durationMinutes: row.durationMinutes,
    capacity: row.capacity,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toProfile(row: ProviderRow, gallery: GalleryRow[]): ProviderProfile {
  return {
    id: row.id,
    userId: row.userId,
    displayName: row.displayName,
    bio: row.bio,
    experienceYears: row.experienceYears,
    experience: row.experience,
    photoUrl: mediaUrl(row.photoKey),
    gallery: gallery.map(toGallery),
    serviceArea: row.serviceArea,
    city: row.city,
    district: row.district,
    latitude: num(row.latitude),
    longitude: num(row.longitude),
    serviceRadiusKm: num(row.serviceRadiusKm),
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function profileValues(input: ProviderWriteInput) {
  return {
    displayName: input.displayName,
    bio: emptyToNull(input.bio),
    experienceYears: input.experienceYears,
    experience: emptyToNull(input.experience),
    serviceArea: emptyToNull(input.serviceArea),
    city: emptyToNull(input.city),
    district: emptyToNull(input.district),
    latitude: input.latitude == null ? null : String(input.latitude),
    longitude: input.longitude == null ? null : String(input.longitude),
    serviceRadiusKm: input.serviceRadiusKm == null ? null : String(input.serviceRadiusKm),
    isActive: input.isActive ?? true,
    updatedAt: new Date(),
  }
}

function serviceValues(input: ProviderServiceWriteInput) {
  return {
    categoryId: input.categoryId,
    title: input.title,
    description: emptyToNull(input.description),
    pricingType: input.pricingType,
    price: input.price == null ? null : String(Math.round(input.price)),
    durationMinutes: input.durationMinutes == null ? null : Math.round(input.durationMinutes),
    capacity: input.capacity ?? 1,
    isActive: input.isActive ?? true,
    updatedAt: new Date(),
  }
}

async function loadGallery(providerId: string) {
  const db = getDb()
  return db.select().from(providerGallery).where(eq(providerGallery.providerId, providerId)).orderBy(asc(providerGallery.sortOrder), asc(providerGallery.createdAt))
}

async function categoryMap() {
  const db = getDb()
  const rows = await db.select().from(serviceCategories)
  return new Map(rows.map(r => [r.id, r.name]))
}

export const providerService = {
  async listCategories(): Promise<ServiceCategory[]> {
    const db = getDb()
    const rows = await db.select().from(serviceCategories).orderBy(asc(serviceCategories.sortOrder))
    return rows.map(toCategory)
  },

  async getByUserId(userId: string): Promise<ProviderRow | null> {
    const db = getDb()
    const [row] = await db.select().from(providers).where(eq(providers.userId, userId)).limit(1)
    return row ?? null
  },

  async requireOwned(userId: string): Promise<ProviderRow> {
    const row = await this.getByUserId(userId)
    if (!row) throw forbidden('ابتدا پرونده ارائه‌دهنده بسازید')
    return row
  },

  async getMine(userId: string): Promise<ProviderProfile | null> {
    const row = await this.getByUserId(userId)
    if (!row) return null
    const gallery = await loadGallery(row.id)
    return toProfile(row, gallery)
  },

  async create(userId: string, input: ProviderWriteInput): Promise<{ profile: ProviderProfile, sessionUser: SessionUser }> {
    const existing = await this.getByUserId(userId)
    if (existing) throw conflict('پرونده ارائه‌دهنده از قبل وجود دارد')

    const db = getDb()
    const [created] = await db.insert(providers).values({
      userId,
      ...profileValues(input),
    }).returning()
    if (!created) throw new Error('Failed to create provider')

    const [current] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!current) throw notFound('کاربر یافت نشد')
    let sessionUser = toSessionUser(current)
    if (current.role !== 'ADMIN' && current.role !== 'PROVIDER') {
      const [updatedUser] = await db.update(users).set({
        role: 'PROVIDER',
        updatedAt: new Date(),
      }).where(eq(users.id, userId)).returning()
      if (updatedUser) sessionUser = toSessionUser(updatedUser)
    }
    logger.info('provider_created', { userId, providerId: created.id })
    return { profile: toProfile(created, []), sessionUser }
  },

  async updateMine(userId: string, input: ProviderWriteInput): Promise<ProviderProfile> {
    const row = await this.requireOwned(userId)
    const db = getDb()
    const [updated] = await db.update(providers).set(profileValues(input)).where(eq(providers.id, row.id)).returning()
    if (!updated) throw notFound('پرونده یافت نشد')
    const gallery = await loadGallery(updated.id)
    logger.info('provider_updated', { userId, providerId: updated.id })
    return toProfile(updated, gallery)
  },

  async setPhoto(userId: string, body: Buffer, contentType: string): Promise<ProviderProfile> {
    const row = await this.requireOwned(userId)
    const storage = getObjectStorage()
    if (row.photoKey) await storage.delete(row.photoKey)
    const key = mediaKey(`providers/${userId}/photo`, contentType)
    await storage.put(key, body, contentType)
    const db = getDb()
    const [updated] = await db.update(providers).set({
      photoKey: key,
      updatedAt: new Date(),
    }).where(eq(providers.id, row.id)).returning()
    if (!updated) throw notFound('پرونده یافت نشد')
    const gallery = await loadGallery(updated.id)
    return toProfile(updated, gallery)
  },

  async addGallery(userId: string, body: Buffer, contentType: string): Promise<ProviderProfile> {
    const row = await this.requireOwned(userId)
    const gallery = await loadGallery(row.id)
    if (gallery.length >= MAX_GALLERY_IMAGES) {
      throw validationError({ field: 'file' }, `حداکثر ${MAX_GALLERY_IMAGES} تصویر در گالری مجاز است`)
    }
    const key = mediaKey(`providers/${userId}/gallery`, contentType)
    await getObjectStorage().put(key, body, contentType)
    const db = getDb()
    await db.insert(providerGallery).values({
      providerId: row.id,
      imageKey: key,
      sortOrder: gallery.length,
    })
    return (await this.getMine(userId))!
  },

  async deleteGallery(userId: string, imageId: string): Promise<ProviderProfile> {
    const row = await this.requireOwned(userId)
    const db = getDb()
    const [item] = await db.select().from(providerGallery).where(and(eq(providerGallery.id, imageId), eq(providerGallery.providerId, row.id))).limit(1)
    if (!item) throw notFound('تصویر یافت نشد')
    await getObjectStorage().delete(item.imageKey)
    await db.delete(providerGallery).where(eq(providerGallery.id, imageId))
    return (await this.getMine(userId))!
  },

  async listPublic(): Promise<ProviderProfile[]> {
    const db = getDb()
    const rows = await db.select().from(providers).where(eq(providers.isActive, true)).orderBy(desc(providers.createdAt))
    const result: ProviderProfile[] = []
    for (const row of rows) {
      const gallery = await loadGallery(row.id)
      result.push(toProfile(row, gallery))
    }
    return result
  },

  async getPublic(id: string): Promise<PublicProvider> {
    const db = getDb()
    const [row] = await db.select().from(providers).where(eq(providers.id, id)).limit(1)
    if (!row || !row.isActive) throw notFound('ارائه‌دهنده یافت نشد')
    const [gallery, services, names] = await Promise.all([
      loadGallery(row.id),
      db.select().from(providerServices).where(and(eq(providerServices.providerId, row.id), eq(providerServices.isActive, true))).orderBy(desc(providerServices.createdAt)),
      categoryMap(),
    ])
    return {
      ...toProfile(row, gallery),
      services: services.map(s => toService(s, names.get(s.categoryId) || '')),
    }
  },

  async listMyServices(userId: string): Promise<ProviderService[]> {
    const row = await this.requireOwned(userId)
    const db = getDb()
    const [services, names] = await Promise.all([
      db.select().from(providerServices).where(eq(providerServices.providerId, row.id)).orderBy(desc(providerServices.createdAt)),
      categoryMap(),
    ])
    return services.map(s => toService(s, names.get(s.categoryId) || ''))
  },

  async createService(userId: string, input: ProviderServiceWriteInput): Promise<ProviderService> {
    const row = await this.requireOwned(userId)
    const names = await categoryMap()
    if (!names.has(input.categoryId)) throw validationError({ field: 'categoryId' }, 'دسته نامعتبر است')
    const db = getDb()
    const [created] = await db.insert(providerServices).values({
      providerId: row.id,
      ...serviceValues(input),
    }).returning()
    if (!created) throw new Error('Failed to create service')
    logger.info('provider_service_created', { userId, serviceId: created.id })
    return toService(created, names.get(created.categoryId) || '')
  },

  async updateService(userId: string, serviceId: string, input: ProviderServiceWriteInput): Promise<ProviderService> {
    const row = await this.requireOwned(userId)
    const names = await categoryMap()
    if (!names.has(input.categoryId)) throw validationError({ field: 'categoryId' }, 'دسته نامعتبر است')
    const db = getDb()
    const [existing] = await db.select().from(providerServices).where(and(eq(providerServices.id, serviceId), eq(providerServices.providerId, row.id))).limit(1)
    if (!existing) throw notFound('خدمت یافت نشد')
    const [updated] = await db.update(providerServices).set(serviceValues(input)).where(eq(providerServices.id, serviceId)).returning()
    if (!updated) throw notFound('خدمت یافت نشد')
    return toService(updated, names.get(updated.categoryId) || '')
  },

  async deleteService(userId: string, serviceId: string) {
    const row = await this.requireOwned(userId)
    const db = getDb()
    const deleted = await db.delete(providerServices).where(and(eq(providerServices.id, serviceId), eq(providerServices.providerId, row.id))).returning()
    if (!deleted.length) throw notFound('خدمت یافت نشد')
  },
}
