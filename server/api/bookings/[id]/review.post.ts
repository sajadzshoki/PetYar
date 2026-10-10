import { handleApi } from '../../../utils/api-response'
import { requireAuth } from '../../../utils/authorization'
import { parseBody } from '../../../utils/validate'
import { uuidParamSchema } from '../../../../shared/validation/pet'
import { reviewWriteSchema } from '../../../../shared/validation/review'
import { reviewService } from '../../../services/review.service'
import { HTTP_STATUS } from '../../../../shared/constants/api'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const input = parseBody(reviewWriteSchema, await readBody(event))
  const review = await reviewService.createForOwner(session.id, id, input)
  setResponseStatus(HTTP_STATUS.CREATED)
  return { status: 'ok' as const, data: { review } }
}))
