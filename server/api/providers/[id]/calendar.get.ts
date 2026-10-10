import { eq } from 'drizzle-orm'
import { handleApi } from '../../../utils/api-response'
import { parseBody } from '../../../utils/validate'
import { flattenQuery } from '../../../utils/query'
import { uuidParamSchema } from '../../../../shared/validation/pet'
import { calendarQuerySchema } from '../../../../shared/validation/availability'
import { availabilityService } from '../../../services/availability.service'
import { getDb } from '../../../db/client'
import { providers } from '../../../db/schema'
import { notFound } from '../../../utils/errors'
import { PROVIDER_TIMEZONE } from '../../../../shared/constants/availability'

export default defineEventHandler(event => handleApi(async () => {
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const input = parseBody(calendarQuerySchema, flattenQuery(getQuery(event) as Record<string, unknown>))
  const db = getDb()
  const [row] = await db.select({ id: providers.id, isActive: providers.isActive }).from(providers).where(eq(providers.id, id)).limit(1)
  if (!row || !row.isActive) throw notFound('ارائه‌دهنده یافت نشد')
  const days = await availabilityService.calendarForProvider(id, input.from, input.to)
  return { status: 'ok' as const, data: { timezone: PROVIDER_TIMEZONE, days } }
}))
