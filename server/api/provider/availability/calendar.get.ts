import { handleApi } from '../../../utils/api-response'
import { requireAuth } from '../../../utils/authorization'
import { parseBody } from '../../../utils/validate'
import { flattenQuery } from '../../../utils/query'
import { calendarQuerySchema } from '../../../../shared/validation/availability'
import { availabilityService } from '../../../services/availability.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const input = parseBody(calendarQuerySchema, flattenQuery(getQuery(event) as Record<string, unknown>))
  const days = await availabilityService.calendarMine(session.id, input.from, input.to)
  return { status: 'ok' as const, data: { timezone: 'Asia/Tehran', days } }
}))
