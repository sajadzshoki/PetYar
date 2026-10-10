import { handleApi } from '../../../utils/api-response'
import { requireAuth } from '../../../utils/authorization'
import { parseBody } from '../../../utils/validate'
import { uuidParamSchema } from '../../../../shared/validation/pet'
import { messagingService } from '../../../services/messaging.service'
import { bookingService } from '../../../services/booking.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  try {
    await bookingService.getForOwner(session.id, id)
  }
  catch {
    await bookingService.getForProvider(session.id, id)
  }
  const row = await messagingService.ensureForBooking(id)
  const conversation = await messagingService.getMine(session.id, row.id)
  return { status: 'ok' as const, data: { conversation } }
}))
