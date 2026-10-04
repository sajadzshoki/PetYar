import { z } from 'zod'
import { MAX_MESSAGE_LENGTH } from '../constants/messaging'

export const conversationCreateSchema = z.object({
  providerId: z.string().uuid('ارائه‌دهنده نامعتبر است'),
})

export const messageWriteSchema = z.object({
  body: z.string().trim().max(MAX_MESSAGE_LENGTH, 'پیام خیلی طولانی است').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (!data.body || !data.body.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'متن پیام خالی است', path: ['body'] })
  }
})

export type ConversationCreateInput = z.output<typeof conversationCreateSchema>
export type MessageWriteInput = z.output<typeof messageWriteSchema>
