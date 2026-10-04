import { registerSchema } from '../../../shared/validation/auth'
import { parseBody } from '../../utils/validate'
import { authService } from '../../services/auth.service'
import { handleApi } from '../../utils/api-response'
import { HTTP_STATUS } from '../../../shared/constants/api'

export default defineEventHandler(event => handleApi(async () => {
  const raw = await readBody(event)
  const input = parseBody(registerSchema, raw)
  const { publicUser, sessionUser } = await authService.register(input)
  await setUserSession(event as never, { user: sessionUser })
  setResponseStatus(HTTP_STATUS.CREATED)
  return { status: 'ok' as const, data: { user: publicUser } }
}))
