import { handleApi } from '../../../utils/api-response'
import { requireAuth } from '../../../utils/authorization'
import { availabilityService } from '../../../services/availability.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const rules = await availabilityService.listRules(session.id)
  return { status: 'ok' as const, data: { rules } }
}))
