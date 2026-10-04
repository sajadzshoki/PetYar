import { handleApi } from '../../utils/api-response'
import { parseBody } from '../../utils/validate'
import { flattenQuery } from '../../utils/query'
import { bookingQuoteQuerySchema } from '../../../shared/validation/booking'
import { bookingService } from '../../services/booking.service'

export default defineEventHandler(event => handleApi(async () => {
  const input = parseBody(bookingQuoteQuerySchema, flattenQuery(getQuery(event) as Record<string, unknown>))
  const quote = await bookingService.quote(input.providerId, input.serviceId, input.start, input.end)
  return { status: 'ok' as const, data: { quote } }
}))
