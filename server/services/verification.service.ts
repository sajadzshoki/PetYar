import { desc, eq } from 'drizzle-orm'
import { getDb } from '../db/client'
import { providers, verificationApplications, verificationDocuments } from '../db/schema'
import type { VerificationApplicationRow, VerificationDocumentRow } from '../db/schema/moderation'
import type { VerificationApplication, VerificationDocument } from '../../shared/types/moderation'
import type { VerificationWriteInput } from '../../shared/validation/moderation'
import type { VerificationDocumentKind, VerificationStatus } from '../../shared/constants/moderation'
import { conflict, notFound, validationError } from '../utils/errors'
import { getObjectStorage } from '../storage'
import { mediaKey, mediaUrl } from '../utils/media'
import { providerService } from './provider.service'
import { auditService } from './audit.service'
import { requireAdminActor } from '../utils/admin-actor'
import { notificationService } from './notification.service'

function toDoc(row: VerificationDocumentRow): VerificationDocument {
  return {
    id: row.id,
    kind: row.kind,
    imageUrl: mediaUrl(row.imageKey)!,
    createdAt: row.createdAt.toISOString(),
  }
}

function toApp(
  row: VerificationApplicationRow,
  docs: VerificationDocumentRow[],
  providerName: string,
  userId: string,
): VerificationApplication {
  return {
    id: row.id,
    providerId: row.providerId,
    providerName,
    userId,
    status: row.status,
    legalName: row.legalName,
    nationalId: row.nationalId || null,
    city: row.city,
    notes: row.notes,
    reviewNote: row.reviewNote,
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    documents: docs.map(toDoc),
    createdAt: row.createdAt.toISOString(),
  }
}

const editable: VerificationStatus[] = ['UNVERIFIED', 'NEEDS_CHANGES', 'REJECTED']

export const verificationService = {
  async getMine(userId: string): Promise<VerificationApplication | null> {
    const provider = await providerService.requireOwned(userId)
    return this.latestForProvider(provider.id)
  },

  async latestForProvider(providerId: string): Promise<VerificationApplication | null> {
    const db = getDb()
    const [row] = await db.select().from(verificationApplications)
      .where(eq(verificationApplications.providerId, providerId))
      .orderBy(desc(verificationApplications.createdAt))
      .limit(1)
    if (!row) return null
    const [provider] = await db.select().from(providers).where(eq(providers.id, providerId)).limit(1)
    const docs = await db.select().from(verificationDocuments)
      .where(eq(verificationDocuments.applicationId, row.id))
      .orderBy(desc(verificationDocuments.createdAt))
    return toApp(row, docs, provider?.displayName || '', provider?.userId || '')
  },

  async saveMine(userId: string, input: VerificationWriteInput): Promise<VerificationApplication> {
    const provider = await providerService.requireOwned(userId)
    const db = getDb()
    const current = await this.latestForProvider(provider.id)
    if (current?.status === 'PENDING') {
      throw conflict('درخواست در صف بررسی است و قابل ویرایش نیست')
    }
    if (current?.status === 'APPROVED') {
      throw conflict('پرونده احراز تأیید شده است')
    }
    const values = {
      legalName: input.legalName,
      nationalId: input.nationalId,
      city: input.city?.trim() || null,
      notes: input.notes?.trim() || null,
      updatedAt: new Date(),
    }
    if (!current) {
      const [created] = await db.insert(verificationApplications).values({
        providerId: provider.id,
        status: 'UNVERIFIED',
        ...values,
      }).returning()
      if (!created) throw new Error('Failed to create verification')
    }
    else {
      await db.update(verificationApplications).set(values).where(eq(verificationApplications.id, current.id))
    }
    const saved = await this.latestForProvider(provider.id)
    if (!saved) throw new Error('verification missing')
    return saved
  },

  async addDocument(userId: string, kind: VerificationDocumentKind, body: Buffer, contentType: string) {
    const provider = await providerService.requireOwned(userId)
    let current = await this.latestForProvider(provider.id)
    if (!current) {
      const db = getDb()
      const [created] = await db.insert(verificationApplications).values({
        providerId: provider.id,
        status: 'UNVERIFIED',
        legalName: '',
      }).returning()
      if (!created) throw new Error('Failed to create verification')
      current = await this.latestForProvider(provider.id)
      if (!current) throw notFound()
    }
    if (current.status === 'PENDING' || current.status === 'APPROVED') {
      throw conflict('در این وضعیت نمی‌توان مدرک افزود')
    }
    const db = getDb()
    const existing = await db.select().from(verificationDocuments)
      .where(eq(verificationDocuments.applicationId, current.id))
    if (existing.length >= 8) throw conflict('حداکثر ۸ مدرک')
    const key = mediaKey(`verification/${provider.id}`, contentType)
    await getObjectStorage().put(key, body, contentType)
    await db.insert(verificationDocuments).values({
      applicationId: current.id,
      kind,
      imageKey: key,
    })
    const saved = await this.latestForProvider(provider.id)
    if (!saved) throw notFound()
    return saved
  },

  async submitMine(userId: string): Promise<VerificationApplication> {
    const provider = await providerService.requireOwned(userId)
    const current = await this.latestForProvider(provider.id)
    if (!current) throw conflict('ابتدا اطلاعات احراز را ذخیره کنید')
    if (!editable.includes(current.status as VerificationStatus)) {
      throw conflict('این درخواست قابل ارسال نیست')
    }
    if (current.legalName.trim().length < 2 || !current.nationalId || current.nationalId.length < 10) {
      throw validationError({ field: 'legalName' }, 'نام و کد ملی را کامل کنید')
    }
    if (!current.documents.length) {
      throw conflict('حداقل یک مدرک تصویر لازم است')
    }
    const db = getDb()
    await db.update(verificationApplications).set({
      status: 'PENDING',
      submittedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(verificationApplications.id, current.id))
    await db.update(providers).set({
      verificationStatus: 'PENDING',
      updatedAt: new Date(),
    }).where(eq(providers.id, provider.id))
    await auditService.record({
      actorId: userId,
      action: 'verification.submit',
      entityType: 'verification',
      entityId: current.id,
    })
    const saved = await this.latestForProvider(provider.id)
    if (!saved) throw notFound()
    return saved
  },

  async listPending(): Promise<VerificationApplication[]> {
    const db = getDb()
    const rows = await db.select().from(verificationApplications)
      .orderBy(desc(verificationApplications.submittedAt), desc(verificationApplications.createdAt))
      .limit(80)
    const result: VerificationApplication[] = []
    for (const row of rows) {
      const item = await this.latestById(row.id)
      if (item) result.push(item)
    }
    return result
  },

  async latestById(id: string): Promise<VerificationApplication | null> {
    const db = getDb()
    const [row] = await db.select().from(verificationApplications).where(eq(verificationApplications.id, id)).limit(1)
    if (!row) return null
    const [provider] = await db.select().from(providers).where(eq(providers.id, row.providerId)).limit(1)
    const docs = await db.select().from(verificationDocuments).where(eq(verificationDocuments.applicationId, row.id))
    return toApp(row, docs, provider?.displayName || '', provider?.userId || '')
  },

  async require(id: string): Promise<VerificationApplication> {
    const row = await this.latestById(id)
    if (!row) throw notFound('درخواست احراز یافت نشد')
    return row
  },

  async review(adminId: string, id: string, status: 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES', note?: string) {
    await requireAdminActor(adminId)
    const current = await this.require(id)
    if (current.status !== 'PENDING') {
      throw conflict('فقط درخواست در صف بررسی قابل تصمیم است')
    }
    const db = getDb()
    await db.update(verificationApplications).set({
      status,
      reviewNote: note?.trim() || null,
      reviewedAt: new Date(),
      reviewedBy: adminId,
      updatedAt: new Date(),
    }).where(eq(verificationApplications.id, id))
    await db.update(providers).set({
      verificationStatus: status,
      verificationNote: note?.trim() || null,
      verifiedAt: status === 'APPROVED' ? new Date() : null,
      updatedAt: new Date(),
    }).where(eq(providers.id, current.providerId))
    await auditService.record({
      actorId: adminId,
      action: `verification.${status.toLowerCase()}`,
      entityType: 'verification',
      entityId: id,
      metadata: { note: note || null },
    })
    await notificationService.notify({
      userId: current.userId,
      type: 'VERIFICATION_UPDATE',
      title: 'وضعیت احراز هویت',
      body: status === 'APPROVED'
        ? 'مدارک شما تأیید شد.'
        : status === 'REJECTED'
          ? 'مدارک احراز رد شد.'
          : 'برای احراز هویت نیاز به اصلاح مدارک است.',
      href: '/provider/verification',
      entityType: 'verification',
      entityId: id,
    })
    const saved = await this.latestById(id)
    if (!saved) throw notFound()
    return saved
  },
}
