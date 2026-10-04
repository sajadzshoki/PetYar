import { eq } from 'drizzle-orm'
import { getDb } from '../db/client'
import { users } from '../db/schema'
import type { LoginInput, RegisterInput } from '../../shared/validation/auth'
import { DEFAULT_USER_ROLE } from '../../shared/constants/roles'
import { conflict, unauthorized } from '../utils/errors'
import type { PublicUser } from '../../shared/types/user'
import { logger } from '../utils/logger'
import { toPublicUser, toSessionUser } from './profile.service'

export const authService = {
  async register(input: RegisterInput) {
    const db = getDb()
    const email = input.email

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    if (existing.length > 0) {
      throw conflict('این ایمیل قبلاً ثبت شده است')
    }

    const role = input.role === 'ADMIN' ? DEFAULT_USER_ROLE : (input.role ?? DEFAULT_USER_ROLE)
    const passwordHash = await hashPassword(input.password)

    const [created] = await db.insert(users).values({
      email,
      passwordHash,
      displayName: input.displayName,
      firstName: input.displayName,
      lastName: '',
      role,
    }).returning()

    if (!created) {
      throw new Error('Failed to create user')
    }

    logger.info('user_registered', { userId: created.id, role: created.role })
    return { publicUser: toPublicUser(created), sessionUser: toSessionUser(created) }
  },

  async login(input: LoginInput) {
    const db = getDb()
    const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1)

    if (!user) {
      throw unauthorized('ایمیل یا رمز عبور نادرست است')
    }

    const valid = await verifyPassword(user.passwordHash, input.password)
    if (!valid) {
      throw unauthorized('ایمیل یا رمز عبور نادرست است')
    }

    logger.info('user_login', { userId: user.id })
    return { publicUser: toPublicUser(user), sessionUser: toSessionUser(user) }
  },

  async getById(id: string): Promise<PublicUser | null> {
    const db = getDb()
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
    return user ? toPublicUser(user) : null
  },
}
