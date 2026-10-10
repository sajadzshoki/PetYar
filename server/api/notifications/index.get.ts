import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { notificationService } from '../../services/notification.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const query = getQuery(event)
  const unreadOnly = query.unread === '1' || query.unread === 'true'
  const items = await notificationService.list(session.id, unreadOnly)
  return { status: 'ok' as const, data: { notifications: items } }
}))
