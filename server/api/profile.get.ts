import { handleApi } from '../utils/api-response'
import { requireAuth } from '../utils/authorization'
import { profileService } from '../services/profile.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const user = await profileService.getById(session.id)
  return { status: 'ok' as const, data: { user } }
}))
