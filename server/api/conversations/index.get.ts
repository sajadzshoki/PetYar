import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { messagingService } from '../../services/messaging.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const items = await messagingService.listMine(session.id)
  return { status: 'ok' as const, data: { conversations: items } }
}))
