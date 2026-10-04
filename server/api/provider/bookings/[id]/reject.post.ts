import { handleApi } from '../../../../utils/api-response'
import { requireAuth } from '../../../../utils/authorization'
import { parseBody } from '../../../../utils/validate'
import { uuidParamSchema } from '../../../../../shared/validation/pet'
import { bookingRejectSchema } from '../../../../../shared/validation/booking'
import { bookingService } from '../../../../services/booking.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const input = parseBody(bookingRejectSchema, (await readBody(event).catch(() => ({}))) || {})
  const booking = await bookingService.reject(session.id, id, input.reason || undefined)
  return { status: 'ok' as const, data: { booking } }
}))
