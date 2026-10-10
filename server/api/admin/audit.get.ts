import { handleApi } from '../../utils/api-response'
import { requireAdmin } from '../../utils/authorization'
import { auditService } from '../../services/audit.service'

export default defineEventHandler(event => handleApi(async () => {
  await requireAdmin(event as never)
  const logs = await auditService.list()
  return { status: 'ok' as const, data: { logs } }
}))
