import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { authService } from '../../services/auth.service'
import { unauthorized } from '../../utils/errors'

export default defineEventHandler(event => handleApi(async () => {
  const sessionUser = await requireAuth(event as never)
  const user = await authService.getById(sessionUser.id)
  if (!user) throw unauthorized()
  return { status: 'ok' as const, data: { user } }
}))
