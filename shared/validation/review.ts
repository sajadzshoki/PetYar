import { z } from 'zod'
import { REVIEW_SCORE_MAX, REVIEW_SCORE_MIN } from '../constants/reviews'

const score = z.coerce.number().int().min(REVIEW_SCORE_MIN, 'امتیاز باید بین ۱ و ۵ باشد').max(REVIEW_SCORE_MAX, 'امتیاز باید بین ۱ و ۵ باشد')

export const reviewWriteSchema = z.object({
  overall: score,
  communication: score,
  quality: score,
  punctuality: score,
  care: score,
  comment: z.string().trim().min(10, 'نظر را کمی کامل‌تر بنویسید').max(2000, 'نظر خیلی طولانی است'),
})

export const favoriteWriteSchema = z.object({
  providerId: z.string().uuid('ارائه‌دهنده نامعتبر است'),
})

export type ReviewWriteInput = z.output<typeof reviewWriteSchema>
