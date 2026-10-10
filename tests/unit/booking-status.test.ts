import assert from 'node:assert/strict'
import test from 'node:test'
import { canTransitionBooking } from '../../shared/utils/booking-status'

test('complete is not allowed from CANCELLED', () => {
  assert.equal(canTransitionBooking('CANCELLED', 'COMPLETED', ['IN_PROGRESS']), false)
})

test('complete is not allowed from COMPLETED (not idempotent)', () => {
  assert.equal(canTransitionBooking('COMPLETED', 'COMPLETED', ['IN_PROGRESS']), false)
})

test('complete is allowed from IN_PROGRESS', () => {
  assert.equal(canTransitionBooking('IN_PROGRESS', 'COMPLETED', ['IN_PROGRESS']), true)
})

test('pay-related confirm is not allowed from PENDING', () => {
  assert.equal(canTransitionBooking('PENDING', 'CONFIRMED', ['ACCEPTED']), false)
})
