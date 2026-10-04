import { handleApi } from '../../utils/api-response'
import { parseBody } from '../../utils/validate'
import { uuidParamSchema } from '../../../shared/validation/pet'
import { providerService } from '../../services/provider.service'

export default defineEventHandler(event => handleApi(async () => {
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const provider = await providerService.getPublic(id)
  return { status: 'ok' as const, data: { provider } }
}))
