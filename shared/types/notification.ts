import type { NotificationType } from '../constants/notifications'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  href: string | null
  entityType: string | null
  entityId: string | null
  readAt: string | null
  createdAt: string
}
