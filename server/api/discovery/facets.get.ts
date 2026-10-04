import { handleApi } from '../../utils/api-response'
import { searchService } from '../../services/search.service'

export default defineEventHandler(() => handleApi(async () => {
  const facets = await searchService.facets()
  return { status: 'ok' as const, data: { facets } }
}))
