import { handleApi } from '../../../utils/api-response'
import { parseBody } from '../../../utils/validate'
import { uuidParamSchema } from '../../../../shared/validation/pet'
import { reviewService } from '../../../services/review.service'
import { providerService } from '../../../services/provider.service'

export default defineEventHandler(event => handleApi(async () => {
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  await providerService.getPublic(id)
  const [summary, reviews] = await Promise.all([
    reviewService.summaryForProvider(id),
    reviewService.listForProvider(id),
  ])
  return { status: 'ok' as const, data: { summary, reviews } }
}))
