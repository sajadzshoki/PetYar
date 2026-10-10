import assert from 'node:assert/strict'
import test from 'node:test'
import { rateLimit } from '../../server/utils/rate-limit'
import { AppError } from '../../server/utils/errors'

test('rateLimit trips after the window budget', () => {
  const key = `test:${Date.now()}:${Math.random()}`
  for (let i = 0; i < 3; i++) rateLimit(key, 3, 60_000)
  assert.throws(() => rateLimit(key, 3, 60_000), (err: unknown) => err instanceof AppError && err.code === 'RATE_LIMITED')
})
