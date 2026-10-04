import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { parseBody } from '../../utils/validate'
import { favoriteWriteSchema } from '../../../shared/validation/review'
import { reviewService } from '../../services/review.service'
import { HTTP_STATUS } from '../../../shared/constants/api'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const input = parseBody(favoriteWriteSchema, await readBody(event))
  const result = await reviewService.addFavorite(session.id, input.providerId)
  setResponseStatus(HTTP_STATUS.CREATED)
  return { status: 'ok' as const, data: result }
}))
