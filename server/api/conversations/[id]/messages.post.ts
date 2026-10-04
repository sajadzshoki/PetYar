import { handleApi } from '../../../utils/api-response'
import { requireAuth } from '../../../utils/authorization'
import { parseBody } from '../../../utils/validate'
import { uuidParamSchema } from '../../../../shared/validation/pet'
import { messageWriteSchema } from '../../../../shared/validation/messaging'
import { messagingService } from '../../../services/messaging.service'
import { HTTP_STATUS } from '../../../../shared/constants/api'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const input = parseBody(messageWriteSchema, await readBody(event))
  const message = await messagingService.send(session.id, id, input.body || '')
  setResponseStatus(HTTP_STATUS.CREATED)
  return { status: 'ok' as const, data: { message } }
}))
