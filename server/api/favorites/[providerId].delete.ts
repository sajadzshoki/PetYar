import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { parseBody } from '../../utils/validate'
import { uuidParamSchema } from '../../../shared/validation/pet'
import { reviewService } from '../../services/review.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const providerId = parseBody(uuidParamSchema, getRouterParam(event, 'providerId'))
  const result = await reviewService.removeFavorite(session.id, providerId)
  return { status: 'ok' as const, data: result }
}))
