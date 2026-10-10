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
  const { authService } = await import('../services/auth.service')
  const row = await authService.getRowById(user.id)
  if (!row || row.status !== 'ACTIVE') {
    await clearUserSession(event as never).catch(() => undefined)
    throw unauthorized()
  }
  return { id: row.id, email: row.email, displayName: row.displayName, role: row.role }
}

export async function requireRole(event: AuthEvent, roles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth(event)
  if (!roles.includes(user.role)) {
    throw forbidden()
  }
  return user
}

/** Re-reads role and status from the database. Do not trust the session cookie alone. */
export async function requireAdmin(event: AuthEvent): Promise<SessionUser> {
  const session = await requireAuth(event)
  const { authService } = await import('../services/auth.service')
  const row = await authService.getRowById(session.id)
  if (!row || row.role !== 'ADMIN' || row.status !== 'ACTIVE') {
    throw forbidden()
  }
  return { id: row.id, email: row.email, displayName: row.displayName, role: row.role }
}
