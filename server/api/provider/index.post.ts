import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { parseBody } from '../../utils/validate'
import { providerWriteSchema } from '../../../shared/validation/provider'
import { providerService } from '../../services/provider.service'
import { HTTP_STATUS } from '../../../shared/constants/api'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const input = parseBody(providerWriteSchema, await readBody(event))
  const { profile, sessionUser } = await providerService.create(session.id, input)
  await setUserSession(event as never, { user: sessionUser })
  setResponseStatus(HTTP_STATUS.CREATED)
  return { status: 'ok' as const, data: { provider: profile } }
}))
