import { handleApi } from '../../../utils/api-response'
import { requireAdmin } from '../../../utils/authorization'
import { verificationService } from '../../../services/verification.service'
import { parseBody } from '../../../utils/validate'
import { uuidParamSchema } from '../../../../shared/validation/pet'

export default defineEventHandler(event => handleApi(async () => {
  await requireAdmin(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const application = await verificationService.require(id)
  return { status: 'ok' as const, data: { application } }
}))
