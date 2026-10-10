import { handleApi } from '../../../utils/api-response'
import { requireAdmin } from '../../../utils/authorization'
import { disputeService } from '../../../services/dispute.service'
import { parseBody } from '../../../utils/validate'
import { uuidParamSchema } from '../../../../shared/validation/pet'

export default defineEventHandler(event => handleApi(async () => {
  await requireAdmin(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const dispute = await disputeService.require(id)
  return { status: 'ok' as const, data: { dispute } }
}))
