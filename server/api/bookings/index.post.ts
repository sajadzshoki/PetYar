import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { parseBody } from '../../utils/validate'
import { bookingCreateSchema } from '../../../shared/validation/booking'
import { bookingService } from '../../services/booking.service'
import { HTTP_STATUS } from '../../../shared/constants/api'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const input = parseBody(bookingCreateSchema, await readBody(event))
  const booking = await bookingService.create(session.id, input)
  setResponseStatus(HTTP_STATUS.CREATED)
  return { status: 'ok' as const, data: { booking } }
}))
