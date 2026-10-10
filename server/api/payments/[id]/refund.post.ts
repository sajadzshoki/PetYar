import { handleApi } from '../../../utils/api-response'
import { requireAuth } from '../../../utils/authorization'
import { parseBody } from '../../../utils/validate'
import { uuidParamSchema } from '../../../../shared/validation/pet'
import { paymentRefundSchema } from '../../../../shared/validation/payment'
import { paymentService } from '../../../services/payment.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const input = parseBody(paymentRefundSchema, await readBody(event))
  const payment = await paymentService.refundForOwner(session.id, id, input.amount, input.reason)
  return { status: 'ok' as const, data: { payment } }
}))
