import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let queryClient: ReturnType<typeof postgres> | null = null
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not configured')
  }
  return url
}

export function getDb() {
  if (!dbInstance) {
    queryClient = postgres(getDatabaseUrl(), { max: 10 })
    dbInstance = drizzle(queryClient, { schema })
  }
  return dbInstance
}

export async function pingDatabase(): Promise<boolean> {
  const client = queryClient ?? postgres(getDatabaseUrl(), { max: 1 })
  try {
    await client`select 1`
    return true
  }
  finally {
    if (!queryClient) {
      await client.end({ timeout: 1 })
    }
  }
}

export async function closeDb() {
  if (queryClient) {
    await queryClient.end({ timeout: 5 })
    queryClient = null
    dbInstance = null
  }
}
