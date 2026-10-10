import { handleApi } from '../../../utils/api-response'
import { requireAuth } from '../../../utils/authorization'
import { availabilityService } from '../../../services/availability.service'
import { flattenQuery } from '../../../utils/query'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const q = flattenQuery(getQuery(event) as Record<string, unknown>)
  const exceptions = await availabilityService.listExceptions(session.id, q.from, q.to)
  return { status: 'ok' as const, data: { exceptions } }
}))
