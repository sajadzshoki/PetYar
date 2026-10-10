import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { petService } from '../../services/pet.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const query = getQuery(event)
  const includeArchived = query.archived === '1' || query.archived === 'true'
  const items = await petService.list(session.id, includeArchived)
  return { status: 'ok' as const, data: { pets: items } }
}))
