import type { z } from 'zod'
import { validationError } from './errors'

export function parseBody<S extends z.ZodTypeAny>(schema: S, raw: unknown): z.output<S> {
  const result = schema.safeParse(raw)
  if (!result.success) {
    const details = result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    throw validationError(details)
  }
  return result.data
}
