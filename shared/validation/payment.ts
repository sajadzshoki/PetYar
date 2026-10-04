import { z } from 'zod'

export const paymentRefundSchema = z.object({
  amount: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value === null || value === undefined || value === '') return null
      const n = typeof value === 'number' ? value : Number(value)
      return Number.isInteger(n) ? n : null
    })
    .refine(value => value === null || value > 0, 'مبلغ بازپرداخت نامعتبر است'),
  reason: z.string().trim().min(3, 'دلیل بازپرداخت را بنویسید').max(500),
})

export const paymentCallbackQuerySchema = z.object({
  Authority: z.string().min(1).optional(),
  authority: z.string().min(1).optional(),
  Status: z.string().optional(),
  status: z.string().optional(),
  paymentId: z.string().uuid().optional(),
})

export type PaymentRefundInput = z.output<typeof paymentRefundSchema>
