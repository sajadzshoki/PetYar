import { loginSchema } from '../../../shared/validation/auth'
import { parseBody } from '../../utils/validate'
import { authService } from '../../services/auth.service'
import { handleApi } from '../../utils/api-response'
import { clientKey, rateLimit } from '../../utils/rate-limit'

export default defineEventHandler(event => handleApi(async () => {
  rateLimit(clientKey(event, 'login'), 20, 60_000)
  const raw = await readBody(event)
  const input = parseBody(loginSchema, raw)
  const { publicUser, sessionUser } = await authService.login(input)
  await setUserSession(event as never, { user: sessionUser })
  return { status: 'ok' as const, data: { user: publicUser } }
}))
