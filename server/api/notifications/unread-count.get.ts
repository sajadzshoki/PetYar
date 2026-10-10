import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { notificationService } from '../../services/notification.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const count = await notificationService.unreadCount(session.id)
  return { status: 'ok' as const, data: { count } }
}))
