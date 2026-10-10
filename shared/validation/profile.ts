import { z } from 'zod'

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1, 'نام الزامی است').max(60, 'نام خیلی طولانی است'),
  lastName: z.string().trim().max(60, 'نام خانوادگی خیلی طولانی است').default(''),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\-\s]*$/, 'شماره تماس نامعتبر است')
    .optional()
    .or(z.literal('')),
  bio: z.string().trim().max(500, 'بیوگرافی حداکثر ۵۰۰ کاراکتر است').optional().or(z.literal('')),
})

export type ProfileUpdateInput = z.output<typeof profileUpdateSchema>
