import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { parseBody } from '../../utils/validate'
import { uuidParamSchema } from '../../../shared/validation/pet'
import { paymentService } from '../../services/payment.service'
import { providerService } from '../../services/provider.service'
import { forbidden, notFound } from '../../utils/errors'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const row = await paymentService.getById(id)
  if (!row) throw notFound('پرداخت یافت نشد')
  if (row.ownerId === session.id) {
    const payment = await paymentService.requireForOwner(session.id, id)
    return { status: 'ok' as const, data: { payment } }
  }
  const provider = await providerService.getByUserId(session.id)
  if (provider && provider.id === row.providerId) {
    const payment = await paymentService.requireForProvider(provider.id, id)
    return { status: 'ok' as const, data: { payment } }
  }
  throw forbidden()
}))
