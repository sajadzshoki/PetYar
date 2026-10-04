import { handleApi } from '../../../../utils/api-response'
import { requireAuth } from '../../../../utils/authorization'
import { parseBody } from '../../../../utils/validate'
import { uuidParamSchema } from '../../../../../shared/validation/pet'
import { bookingDisputeSchema } from '../../../../../shared/validation/booking'
import { bookingService } from '../../../../services/booking.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const input = parseBody(bookingDisputeSchema, await readBody(event))
  const booking = await bookingService.disputeAsProvider(session.id, id, input.reason)
  return { status: 'ok' as const, data: { booking } }
}))
