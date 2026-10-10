import assert from 'node:assert/strict'
import test from 'node:test'
import { parseIrr, remainingRefundable, splitPlatformFee } from './money'
import { quotePrice } from './pricing'

test('splitPlatformFee 10% of 100000', () => {
  const { fee, payout } = splitPlatformFee(100000, 1000)
  assert.equal(fee, 10000)
  assert.equal(payout, 90000)
})

test('parseIrr rejects floats', () => {
  assert.equal(parseIrr(12.5), null)
  assert.equal(parseIrr('1000'), 1000)
})

test('remainingRefundable never negative', () => {
  assert.equal(remainingRefundable(100, 100), 0)
})

test('hourly quote uses duration', () => {
  const start = new Date('2026-01-01T08:00:00.000Z')
  const end = new Date('2026-01-01T10:00:00.000Z')
  const q = quotePrice('HOURLY', 50000, start, end)
  assert.equal(q.durationMinutes, 120)
  assert.ok(q.totalAmount != null && q.totalAmount > 0)
})
