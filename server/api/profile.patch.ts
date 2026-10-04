import { handleApi } from '../utils/api-response'
import { requireAuth } from '../utils/authorization'
import { parseBody } from '../utils/validate'
import { profileUpdateSchema } from '../../shared/validation/profile'
import { profileService } from '../services/profile.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const input = parseBody(profileUpdateSchema, await readBody(event))
  const { publicUser, sessionUser } = await profileService.update(session.id, input)
  await setUserSession(event as never, { user: sessionUser })
  return { status: 'ok' as const, data: { user: publicUser } }
}))
