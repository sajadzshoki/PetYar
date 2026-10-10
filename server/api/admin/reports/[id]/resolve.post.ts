import { handleApi } from '../../../../utils/api-response'
import { requireAdmin } from '../../../../utils/authorization'
import { reportService } from '../../../../services/report.service'
import { parseBody } from '../../../../utils/validate'
import { uuidParamSchema } from '../../../../../shared/validation/pet'
import { reportResolveSchema } from '../../../../../shared/validation/moderation'

export default defineEventHandler(event => handleApi(async () => {
  const admin = await requireAdmin(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const input = parseBody(reportResolveSchema, await readBody(event))
  const report = await reportService.setStatus(admin.id, id, 'RESOLVED', input.note)
  return { status: 'ok' as const, data: { report } }
}))
