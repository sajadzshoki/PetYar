import { z } from 'zod'
import { EXCEPTION_KINDS, TIME_RE, WEEKDAYS } from '../constants/availability'
import { timeToMinutes } from '../utils/intervals'

const timeSchema = z.string().regex(TIME_RE, 'ساعت باید به صورت HH:MM باشد')

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ نامعتبر است')

function refineTimes(start: string, end: string, ctx: z.RefinementCtx, startPath: string[]) {
  if (timeToMinutes(start) >= timeToMinutes(end)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ساعت پایان باید بعد از ساعت شروع باشد',
      path: startPath,
    })
  }
}

export const availabilityRuleWriteSchema = z.object({
  weekday: z.coerce.number().int().refine((v): v is typeof WEEKDAYS[number] => (WEEKDAYS as readonly number[]).includes(v), 'روز هفته نامعتبر است'),
  startTime: timeSchema,
  endTime: timeSchema,
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => refineTimes(data.startTime, data.endTime, ctx, ['endTime']))

export const availabilityExceptionWriteSchema = z.object({
  date: dateSchema,
  kind: z.enum(EXCEPTION_KINDS),
  startTime: z.union([timeSchema, z.literal(''), z.null()]).optional(),
  endTime: z.union([timeSchema, z.literal(''), z.null()]).optional(),
  note: z.string().trim().max(300).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  const start = data.startTime || null
  const end = data.endTime || null
  if (data.kind === 'OPEN') {
    if (!start || !end) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'برای ساعت اضافه شروع و پایان الزامی است', path: ['startTime'] })
      return
    }
    refineTimes(start, end, ctx, ['endTime'])
    return
  }
  if ((start && !end) || (!start && end)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'برای مسدودی بازه، هر دو ساعت لازم است یا هیچ‌کدام (کل روز)', path: ['endTime'] })
  }
  if (start && end) refineTimes(start, end, ctx, ['endTime'])
})

export const calendarQuerySchema = z.object({
  from: dateSchema,
  to: dateSchema,
}).superRefine((data, ctx) => {
  if (data.from > data.to) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'بازه تاریخ نامعتبر است', path: ['to'] })
  }
})

export const availabilityCheckSchema = z.object({
  start: z.string().min(1, 'زمان شروع الزامی است'),
  end: z.string().min(1, 'زمان پایان الزامی است'),
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

export type AvailabilityRuleWriteInput = z.output<typeof availabilityRuleWriteSchema>
export type AvailabilityExceptionWriteInput = z.output<typeof availabilityExceptionWriteSchema>
