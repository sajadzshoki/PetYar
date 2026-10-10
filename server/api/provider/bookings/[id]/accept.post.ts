import { handleApi } from '../../../../utils/api-response'
import { requireAuth } from '../../../../utils/authorization'
import { parseBody } from '../../../../utils/validate'
import { uuidParamSchema } from '../../../../../shared/validation/pet'
import { bookingNoteSchema } from '../../../../../shared/validation/booking'
import { bookingService } from '../../../../services/booking.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const body = await readBody(event).catch(() => ({}))
  const input = parseBody(bookingNoteSchema, body || {})
  const booking = await bookingService.accept(session.id, id, input.note || undefined)
  return { status: 'ok' as const, data: { booking } }
}))
