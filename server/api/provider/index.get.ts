import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { providerService } from '../../services/provider.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const provider = await providerService.getMine(session.id)
  return { status: 'ok' as const, data: { provider } }
}))
