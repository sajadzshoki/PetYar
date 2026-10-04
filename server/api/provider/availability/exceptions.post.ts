import { handleApi } from '../../../utils/api-response'
import { requireAuth } from '../../../utils/authorization'
import { parseBody } from '../../../utils/validate'
import { availabilityExceptionWriteSchema } from '../../../../shared/validation/availability'
import { availabilityService } from '../../../services/availability.service'
import { HTTP_STATUS } from '../../../../shared/constants/api'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const input = parseBody(availabilityExceptionWriteSchema, await readBody(event))
  const exception = await availabilityService.createException(session.id, input)
  setResponseStatus(HTTP_STATUS.CREATED)
  return { status: 'ok' as const, data: { exception } }
}))
