import { handleApi } from '../../../../utils/api-response'
import { requireAdmin } from '../../../../utils/authorization'
import { adminService } from '../../../../services/admin.service'
import { parseBody } from '../../../../utils/validate'
import { uuidParamSchema } from '../../../../../shared/validation/pet'
import { accountActionSchema } from '../../../../../shared/validation/moderation'

export default defineEventHandler(event => handleApi(async () => {
  const admin = await requireAdmin(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const input = parseBody(accountActionSchema, await readBody(event))
  const user = await adminService.setUserStatus(admin.id, id, 'DEACTIVATED', input.reason)
  return { status: 'ok' as const, data: { user } }
}))
