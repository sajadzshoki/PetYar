import { handleApi } from '../../../utils/api-response'
import { requireAuth } from '../../../utils/authorization'
import { parseBody } from '../../../utils/validate'
import { providerServiceWriteSchema } from '../../../../shared/validation/provider'
import { providerService } from '../../../services/provider.service'
import { HTTP_STATUS } from '../../../../shared/constants/api'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const input = parseBody(providerServiceWriteSchema, await readBody(event))
  const service = await providerService.createService(session.id, input)
  setResponseStatus(HTTP_STATUS.CREATED)
  return { status: 'ok' as const, data: { service } }
}))
