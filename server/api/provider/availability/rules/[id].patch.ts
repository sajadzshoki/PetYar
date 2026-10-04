import { handleApi } from '../../../../utils/api-response'
import { requireAuth } from '../../../../utils/authorization'
import { parseBody } from '../../../../utils/validate'
import { uuidParamSchema } from '../../../../../shared/validation/pet'
import { availabilityRuleWriteSchema } from '../../../../../shared/validation/availability'
import { availabilityService } from '../../../../services/availability.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const input = parseBody(availabilityRuleWriteSchema, await readBody(event))
  const rule = await availabilityService.updateRule(session.id, id, input)
  return { status: 'ok' as const, data: { rule } }
}))
