import assert from 'node:assert/strict'
import test from 'node:test'
import { registerSchema } from '../../shared/validation/auth'
import { bookingCreateSchema } from '../../shared/validation/booking'
import { paymentCallbackQuerySchema, paymentRefundSchema } from '../../shared/validation/payment'
import { reportCreateSchema } from '../../shared/validation/moderation'

test('register schema rejects ADMIN role', () => {
  const result = registerSchema.safeParse({
    email: 'a@b.com',
    password: 'password12',
    displayName: 'مدیر جعلی',
    role: 'ADMIN',
  })
  assert.equal(result.success, false)
})

test('booking create ignores client amount and requires valid range', () => {
  const ok = bookingCreateSchema.parse({
    providerId: '11111111-1111-4111-8111-111111111111',
    serviceId: '11111111-1111-4111-8111-111111111112',
    petId: '11111111-1111-4111-8111-111111111113',
    start: '2026-06-01T08:00:00.000Z',
    end: '2026-06-01T10:00:00.000Z',
    amount: 1,
    totalAmount: 999999,
  })
  assert.equal('amount' in ok, false)
  assert.equal('totalAmount' in ok, false)

  const bad = bookingCreateSchema.safeParse({
    providerId: '11111111-1111-4111-8111-111111111111',
    serviceId: '11111111-1111-4111-8111-111111111112',
    petId: '11111111-1111-4111-8111-111111111113',
    start: '2026-06-01T10:00:00.000Z',
    end: '2026-06-01T08:00:00.000Z',
  })
  assert.equal(bad.success, false)
})

test('callback query requires uuid paymentId when present', () => {
  assert.equal(paymentCallbackQuerySchema.safeParse({ paymentId: 'not-a-uuid' }).success, false)
  assert.equal(paymentCallbackQuerySchema.safeParse({ paymentId: '11111111-1111-4111-8111-111111111111', Status: 'OK' }).success, true)
})

test('refund amount must be a positive integer', () => {
  assert.equal(paymentRefundSchema.safeParse({ amount: 12.5, reason: 'لغو رزرو تست' }).success, false)
  assert.equal(paymentRefundSchema.safeParse({ amount: 1000, reason: 'لغو رزرو تست' }).success, true)
})

test('report payload requires description and known target', () => {
  assert.equal(reportCreateSchema.safeParse({
    targetType: 'PROVIDER',
    targetId: '11111111-1111-4111-8111-111111111111',
    reason: 'SPAM',
    description: 'short',
  }).success, false)
})
