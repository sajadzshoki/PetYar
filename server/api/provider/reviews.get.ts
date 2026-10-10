import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { providerService } from '../../services/provider.service'
import { reviewService } from '../../services/review.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const provider = await providerService.requireOwned(session.id)
  const [summary, reviews] = await Promise.all([
    reviewService.summaryForProvider(provider.id),
    reviewService.listForProvider(provider.id),
  ])
  return { status: 'ok' as const, data: { summary, reviews } }
}))
