import { z } from 'zod'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, SEARCH_SORTS, SEARCH_VIEWS } from '../constants/search'

function blankToUndef(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined
  return value
}

function toNum(value: unknown) {
  const v = blankToUndef(value)
  if (v === undefined) return undefined
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : undefined
}

export const providerSearchSchema = z.object({
  q: z.preprocess(blankToUndef, z.string().trim().max(80).optional()),
  category: z.preprocess(blankToUndef, z.string().uuid('دسته نامعتبر است').optional()),
  city: z.preprocess(blankToUndef, z.string().trim().max(80).optional()),
  district: z.preprocess(blankToUndef, z.string().trim().max(80).optional()),
  priceMin: z.preprocess(toNum, z.number().min(0).max(100_000_000).optional()),
  priceMax: z.preprocess(toNum, z.number().min(0).max(100_000_000).optional()),
  view: z.preprocess(v => blankToUndef(v) ?? 'providers', z.enum(SEARCH_VIEWS)),
  sort: z.preprocess(v => blankToUndef(v) ?? 'newest', z.enum(SEARCH_SORTS)),
  page: z.preprocess(v => toNum(v) ?? 1, z.number().int().min(1)),
  pageSize: z.preprocess(v => toNum(v) ?? DEFAULT_PAGE_SIZE, z.number().int().min(1).max(MAX_PAGE_SIZE)),
  lat: z.preprocess(toNum, z.number().min(-90).max(90).optional()),
  lng: z.preprocess(toNum, z.number().min(-180).max(180).optional()),
  radiusKm: z.preprocess(toNum, z.number().gt(0).max(200).optional()),
}).superRefine((data, ctx) => {
  if (data.priceMin !== undefined && data.priceMax !== undefined && data.priceMin > data.priceMax) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'بازه قیمت نامعتبر است', path: ['priceMax'] })
  }
  if ((data.lat === undefined) !== (data.lng === undefined)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'عرض و طول جغرافیایی باید با هم باشند', path: ['lat'] })
  }
})

export type ProviderSearchInput = z.output<typeof providerSearchSchema>
