import { handleApi } from '../../utils/api-response'
import { requireAdmin } from '../../utils/authorization'
import { adminService } from '../../services/admin.service'

export default defineEventHandler(event => handleApi(async () => {
  await requireAdmin(event as never)
  const overview = await adminService.overview()
  return { status: 'ok' as const, data: { overview } }
}))
