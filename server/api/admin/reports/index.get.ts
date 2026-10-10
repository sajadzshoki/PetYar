import { handleApi } from '../../../utils/api-response'
import { requireAdmin } from '../../../utils/authorization'
import { reportService } from '../../../services/report.service'

export default defineEventHandler(event => handleApi(async () => {
  await requireAdmin(event as never)
  const reports = await reportService.listAll()
  return { status: 'ok' as const, data: { reports } }
}))
