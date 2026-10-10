import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { parseBody } from '../../utils/validate'
import { flattenQuery } from '../../utils/query'
import { paymentCallbackQuerySchema } from '../../../shared/validation/payment'
import { paymentService } from '../../services/payment.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const raw = flattenQuery(getQuery(event) as Record<string, unknown>)
  const input = parseBody(paymentCallbackQuerySchema, raw)
  const payment = await paymentService.handleCallback({
    paymentId: input.paymentId,
    authority: input.Authority || input.authority,
    status: input.Status || input.status,
    actorId: session.id,
  })
  return { status: 'ok' as const, data: { payment } }
}))
