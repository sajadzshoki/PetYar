import { handleApi } from '../../utils/api-response'
import { parseBody } from '../../utils/validate'
import { uuidParamSchema } from '../../../shared/validation/pet'
import { providerService } from '../../services/provider.service'
import { getSessionUser } from '../../utils/authorization'

export default defineEventHandler(event => handleApi(async () => {
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const session = await getSessionUser(event as never)
  const provider = await providerService.getPublic(id, session?.id)
  return { status: 'ok' as const, data: { provider } }
}))
