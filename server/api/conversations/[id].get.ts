import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { parseBody } from '../../utils/validate'
import { uuidParamSchema } from '../../../shared/validation/pet'
import { messagingService } from '../../services/messaging.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const conversation = await messagingService.getMine(session.id, id)
  return { status: 'ok' as const, data: { conversation } }
}))
