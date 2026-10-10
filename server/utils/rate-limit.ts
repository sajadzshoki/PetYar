import { tooManyRequests } from './errors'

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

function prune(now: number) {
  if (buckets.size < 2000) return
  for (const [key, value] of buckets) {
    if (value.resetAt < now) buckets.delete(key)
  }
}

/** In-process limiter. Replace with Redis if the app is multi-instance. */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  prune(now)
  const current = buckets.get(key)
  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  current.count += 1
  if (current.count > limit) throw tooManyRequests()
}

export function clientKey(event: { node?: { req?: { headers?: Record<string, unknown>, socket?: { remoteAddress?: string } } } }, scope: string) {
  const headers = event.node?.req?.headers || {}
  const forwarded = headers['x-forwarded-for']
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : event.node?.req?.socket?.remoteAddress) || 'unknown'
  return `${scope}:${ip.trim()}`
}
