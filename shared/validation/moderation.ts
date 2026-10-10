import { z } from 'zod'
import {
  DISPUTE_RESOLUTIONS,
  REPORT_REASONS,
  REPORT_TARGET_TYPES,
  VERIFICATION_DOCUMENT_KINDS,
} from '../constants/moderation'

export const verificationWriteSchema = z.object({
  legalName: z.string().trim().min(2, 'نام حقوقی الزامی است').max(120),
  nationalId: z.string().trim().min(10, 'کد ملی را کامل وارد کنید').max(10),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
})

export const verificationDocumentKindSchema = z.object({
  kind: z.enum(VERIFICATION_DOCUMENT_KINDS).default('NATIONAL_ID'),
})

export const verificationReviewSchema = z.object({
  note: z.string().trim().max(2000).optional().or(z.literal('')),
})

export const reportCreateSchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: z.string().uuid('شناسه نامعتبر است'),
  reason: z.enum(REPORT_REASONS),
  description: z.string().trim().min(10, 'شرح گزارش را بنویسید').max(2000),
})

export const reportResolveSchema = z.object({
  note: z.string().trim().min(3, 'یادداشت رسیدگی الزامی است').max(2000),
})

export const disputeResolveSchema = z.object({
  resolution: z.enum(DISPUTE_RESOLUTIONS),
  note: z.string().trim().min(3, 'یادداشت الزامی است').max(2000),
})

export const accountActionSchema = z.object({
  reason: z.string().trim().min(3, 'دلیل الزامی است').max(500),
})

export const reviewHideSchema = z.object({
  reason: z.string().trim().min(3, 'دلیل پنهان‌سازی الزامی است').max(500),
})

export type VerificationWriteInput = z.output<typeof verificationWriteSchema>
export type ReportCreateInput = z.output<typeof reportCreateSchema>
