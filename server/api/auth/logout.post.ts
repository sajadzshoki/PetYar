import { handleApi } from '../../utils/api-response'

export default defineEventHandler(event => handleApi(async () => {
  await clearUserSession(event as never)
  return { status: 'ok' as const, data: { loggedOut: true } }
}))
