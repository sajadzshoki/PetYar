import { logger } from '../utils/logger'

export default defineNitroPlugin(() => {
  const password = process.env.NUXT_SESSION_PASSWORD
  if (!password || password.length < 32) {
    logger.warn('session_password_weak', {
      message: 'NUXT_SESSION_PASSWORD must be at least 32 characters',
    })
  }
  if (!process.env.DATABASE_URL) {
    logger.warn('database_url_missing')
  }
})
