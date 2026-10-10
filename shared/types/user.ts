import type { UserRole } from '../constants/roles'
import type { UserStatus } from '../constants/moderation'

export interface PublicUser {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  phone: string | null
  bio: string | null
  avatarUrl: string | null
  role: UserRole
  status: UserStatus
  createdAt: string
}

export interface SessionUser {
  id: string
  email: string
  displayName: string
  role: UserRole
}
