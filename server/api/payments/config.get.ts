import { handleApi } from '../../utils/api-response'
import { paymentService } from '../../services/payment.service'

export default defineEventHandler(_event => handleApi(async () => {
  return { status: 'ok' as const, data: { gateway: paymentService.config() } }
}))
