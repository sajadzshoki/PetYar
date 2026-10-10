import { handleApi } from '../../utils/api-response'
import { parseBody } from '../../utils/validate'
import { flattenQuery } from '../../utils/query'
import { providerSearchSchema } from '../../../shared/validation/search'
import { searchService } from '../../services/search.service'

export default defineEventHandler(event => handleApi(async () => {
  const input = parseBody(providerSearchSchema, flattenQuery(getQuery(event) as Record<string, unknown>))
  const result = await searchService.search(input)
  return { status: 'ok' as const, data: result }
}))
