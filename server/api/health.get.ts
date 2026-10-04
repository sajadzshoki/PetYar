import { pingDatabase } from '../db/client'
import { logger } from '../utils/logger'

export default defineEventHandler(async () => {
  let database = false
  try {
    database = await pingDatabase()
  }
  catch (error) {
    logger.warn('health_db_failed', { message: error instanceof Error ? error.message : String(error) })
  }

  return {
    status: 'ok' as const,
    data: {
      service: 'petyar',
      phase: '01',
      database,
    },
  }
})
