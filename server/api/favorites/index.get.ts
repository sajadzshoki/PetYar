import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { reviewService } from '../../services/review.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const items = await reviewService.listFavorites(session.id)
  return { status: 'ok' as const, data: { favorites: items } }
}))
