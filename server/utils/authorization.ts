import type { UserRole } from '../../shared/constants/roles'
import type { SessionUser } from '../../shared/types/user'
import { forbidden, unauthorized } from './errors'

type AuthEvent = Parameters<typeof getUserSession>[0]

export async function getSessionUser(event: AuthEvent): Promise<SessionUser | null> {
  const session = await getUserSession(event)
  const user = session.user as SessionUser | undefined
  if (!user?.id) return null
  return user
}

export async function requireAuth(event: AuthEvent): Promise<SessionUser> {
  const user = await getSessionUser(event)
  if (!user) throw unauthorized()
  return user
}

export async function requireRole(event: AuthEvent, roles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth(event)
  if (!roles.includes(user.role)) {
    throw forbidden()
  }
  return user
}
