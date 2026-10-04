import { handleApi } from '../utils/api-response'
import { providerService } from '../services/provider.service'

export default defineEventHandler(() => handleApi(async () => {
  const categories = await providerService.listCategories()
  return { status: 'ok' as const, data: { categories } }
}))
