/**
 * Seed strategy (phase 01):
 * - Idempotent: skip if any user already exists.
 * - Creates a single ADMIN account for local development only.
 * - Never run against production without reviewing credentials.
 *
 * Future phases will seed providers, services, and catalog data here.
 */
import { hashPassword } from 'nuxt-auth-utils'
import { eq } from 'drizzle-orm'
import { getDb, closeDb } from './client'
import { users } from './schema'

async function seed() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is required')
  }

  const db = getDb()
  const existing = await db.select({ id: users.id }).from(users).limit(1)
  if (existing.length > 0) {
    console.info('[seed] users already present — skipping')
    return
  }

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@petyar.local'
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe_admin8'
  const passwordHash = await hashPassword(password)

  await db.insert(users).values({
    email,
    passwordHash,
    displayName: 'مدیر پت‌یار',
    role: 'ADMIN',
  })

  const created = await db.select({ email: users.email }).from(users).where(eq(users.email, email))
  console.info(`[seed] created admin ${created[0]?.email}`)
}

seed()
  .catch((error) => {
    console.error('[seed] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDb()
  })
