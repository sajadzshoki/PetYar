import { handleApi } from '../../../utils/api-response'
import { requireAdmin } from '../../../utils/authorization'
import { adminService } from '../../../services/admin.service'
import { flattenQuery } from '../../../utils/query'

export default defineEventHandler(event => handleApi(async () => {
  await requireAdmin(event as never)
  const q = flattenQuery(getQuery(event)).q
  const users = await adminService.listUsers(q)
  return { status: 'ok' as const, data: { users } }
}))
