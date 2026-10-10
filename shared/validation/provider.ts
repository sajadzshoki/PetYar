import { z } from 'zod'
import { PRICING_TYPES } from '../constants/providers'

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''))

const optionalNumber = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === null || value === undefined || value === '') return null
    const n = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(n) ? n : null
  })

export const providerWriteSchema = z.object({
  displayName: z.string().trim().min(2, 'نام نمایشی الزامی است').max(80),
  bio: optionalText(2000),
  experienceYears: optionalNumber.refine(
    value => value === null || (value >= 0 && value <= 60),
    'سابقه نامعتبر است',
  ),
  experience: optionalText(2000),
  serviceArea: optionalText(300),
  city: optionalText(80),
  district: optionalText(80),
  latitude: optionalNumber.refine(
    value => value === null || (value >= -90 && value <= 90),
    'عرض جغرافیایی نامعتبر است',
  ),
  longitude: optionalNumber.refine(
    value => value === null || (value >= -180 && value <= 180),
    'طول جغرافیایی نامعتبر است',
  ),
  serviceRadiusKm: optionalNumber.refine(
    value => value === null || (value > 0 && value <= 200),
    'شعاع خدمات نامعتبر است',
  ),
  isActive: z.boolean().default(true),
})

export const providerServiceWriteSchema = z.object({
  categoryId: z.string().uuid('دسته نامعتبر است'),
  title: z.string().trim().min(2, 'عنوان خدمت الزامی است').max(120),
  description: optionalText(2000),
  pricingType: z.enum(PRICING_TYPES),
  price: optionalNumber.refine(
    value => value === null || (value >= 0 && value <= 100_000_000),
    'قیمت نامعتبر است',
  ),
  durationMinutes: optionalNumber.refine(
    value => value === null || (value >= 5 && value <= 24 * 60),
    'مدت نامعتبر است',
  ),
  capacity: z.coerce.number().int().min(1).max(50).default(1),
  isActive: z.boolean().default(true),
})

export type ProviderWriteInput = z.output<typeof providerWriteSchema>
export type ProviderServiceWriteInput = z.output<typeof providerServiceWriteSchema>
