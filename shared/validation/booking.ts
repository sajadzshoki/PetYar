import { z } from 'zod'

const iso = z.string().min(1, 'زمان الزامی است')

export const bookingCreateSchema = z.object({
  providerId: z.string().uuid('ارائه‌دهنده نامعتبر است'),
  serviceId: z.string().uuid('خدمت نامعتبر است'),
  petId: z.string().uuid('حیوان نامعتبر است'),
  start: iso,
  end: iso,
  note: z.string().trim().max(1000).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  const start = Date.parse(data.start)
  const end = Date.parse(data.end)
  if (Number.isNaN(start)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'زمان شروع نامعتبر است', path: ['start'] })
  }
  if (Number.isNaN(end)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'زمان پایان نامعتبر است', path: ['end'] })
  }
  if (!Number.isNaN(start) && !Number.isNaN(end) && start >= end) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'بازه زمانی نامعتبر است', path: ['end'] })
  }
})

export const bookingQuoteQuerySchema = z.object({
  providerId: z.string().uuid('ارائه‌دهنده نامعتبر است'),
  serviceId: z.string().uuid('خدمت نامعتبر است'),
  start: iso,
  end: iso,
}).superRefine((data, ctx) => {
  const start = Date.parse(data.start)
  const end = Date.parse(data.end)
  if (Number.isNaN(start) || Number.isNaN(end) || start >= end) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'بازه زمانی نامعتبر است', path: ['end'] })
  }
})

export const bookingNoteSchema = z.object({
  note: z.string().trim().max(1000).optional().or(z.literal('')),
})

export const bookingCancelSchema = z.object({
  reason: z.string().trim().min(3, 'دلیل لغو را بنویسید').max(500),
})

export const bookingRejectSchema = z.object({
  reason: z.string().trim().max(500).optional().or(z.literal('')),
})

export const bookingDisputeSchema = z.object({
  reason: z.string().trim().min(3, 'شرح اختلاف الزامی است').max(1000),
})

export type BookingCreateInput = z.output<typeof bookingCreateSchema>
