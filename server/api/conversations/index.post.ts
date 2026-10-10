import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { parseBody } from '../../utils/validate'
import { conversationCreateSchema } from '../../../shared/validation/messaging'
import { messagingService } from '../../services/messaging.service'
import { HTTP_STATUS } from '../../../shared/constants/api'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const input = parseBody(conversationCreateSchema, await readBody(event))
  const conversation = await messagingService.openInquiry(session.id, input.providerId)
  setResponseStatus(HTTP_STATUS.CREATED)
  return { status: 'ok' as const, data: { conversation } }
}))
