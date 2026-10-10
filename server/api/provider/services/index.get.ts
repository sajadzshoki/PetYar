import { handleApi } from '../../../utils/api-response'
import { requireAuth } from '../../../utils/authorization'
import { providerService } from '../../../services/provider.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const services = await providerService.listMyServices(session.id)
  return { status: 'ok' as const, data: { services } }
}))
