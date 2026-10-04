import { z } from 'zod'
import { USER_ROLES } from '../constants/roles'

export const emailSchema = z
  .string({ required_error: 'ایمیل الزامی است' })
  .trim()
  .toLowerCase()
  .email('ایمیل معتبر نیست')
  .max(255)

export const passwordSchema = z
  .string({ required_error: 'رمز عبور الزامی است' })
  .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد')
  .max(128, 'رمز عبور بیش از حد طولانی است')

export const displayNameSchema = z
  .string({ required_error: 'نام نمایشی الزامی است' })
  .trim()
  .min(2, 'نام نمایشی خیلی کوتاه است')
  .max(80, 'نام نمایشی خیلی طولانی است')

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
  role: z.enum(USER_ROLES).optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'رمز عبور الزامی است' }).min(1, 'رمز عبور الزامی است'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
