import { handleApi } from '../../utils/api-response'
import { providerService } from '../../services/provider.service'

export default defineEventHandler(() => handleApi(async () => {
  const providers = await providerService.listPublic()
  return { status: 'ok' as const, data: { providers } }
}))
