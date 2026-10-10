import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { paymentService } from '../../services/payment.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const data = await paymentService.earningsForProvider(session.id)
  return { status: 'ok' as const, data }
}))
