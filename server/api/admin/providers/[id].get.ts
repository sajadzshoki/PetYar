import { handleApi } from '../../../utils/api-response'
import { requireAdmin } from '../../../utils/authorization'
import { adminService } from '../../../services/admin.service'
import { parseBody } from '../../../utils/validate'
import { uuidParamSchema } from '../../../../shared/validation/pet'

export default defineEventHandler(event => handleApi(async () => {
  await requireAdmin(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const provider = await adminService.getProvider(id)
  return { status: 'ok' as const, data: { provider } }
}))
