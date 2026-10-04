import { handleApi } from '../../../utils/api-response'
import { requireAuth } from '../../../utils/authorization'
import { parseBody } from '../../../utils/validate'
import { uuidParamSchema } from '../../../../shared/validation/pet'
import { paymentService } from '../../../services/payment.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const payment = await paymentService.initiateForOwner(session.id, id)
  return { status: 'ok' as const, data: { payment, gateway: paymentService.config() } }
}))
