import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { bookingService } from '../../services/booking.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const items = await bookingService.listMine(session.id)
  return { status: 'ok' as const, data: { bookings: items } }
}))
