import { eq } from 'drizzle-orm'
import { getDb } from '../db/client'
import { users } from '../db/schema'
import { forbidden } from './errors'

export async function requireAdminActor(userId: string) {
  const db = getDb()
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!row || row.role !== 'ADMIN' || row.status !== 'ACTIVE') {
    throw forbidden()
  }
  return row
}
