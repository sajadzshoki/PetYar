import { handleApi } from '../../../../utils/api-response'
import { requireAdmin } from '../../../../utils/authorization'
import { disputeService } from '../../../../services/dispute.service'
import { parseBody } from '../../../../utils/validate'
import { uuidParamSchema } from '../../../../../shared/validation/pet'
import { disputeResolveSchema } from '../../../../../shared/validation/moderation'

export default defineEventHandler(event => handleApi(async () => {
  const admin = await requireAdmin(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const input = parseBody(disputeResolveSchema, await readBody(event))
  const dispute = await disputeService.resolve(admin.id, id, input.resolution, input.note)
  return { status: 'ok' as const, data: { dispute } }
}))
