import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { reportService } from '../../services/report.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const reports = await reportService.listMine(session.id)
  return { status: 'ok' as const, data: { reports } }
}))
