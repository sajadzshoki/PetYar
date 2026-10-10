import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { reportService } from '../../services/report.service'
import { parseBody } from '../../utils/validate'
import { reportCreateSchema } from '../../../shared/validation/moderation'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const input = parseBody(reportCreateSchema, await readBody(event))
  const report = await reportService.create(session.id, input)
  return { status: 'ok' as const, data: { report } }
}))
