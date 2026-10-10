import { handleApi } from '../../../../utils/api-response'
import { requireAdmin } from '../../../../utils/authorization'
import { adminService } from '../../../../services/admin.service'
import { parseBody } from '../../../../utils/validate'
import { uuidParamSchema } from '../../../../../shared/validation/pet'
import { reviewHideSchema } from '../../../../../shared/validation/moderation'

export default defineEventHandler(event => handleApi(async () => {
  const admin = await requireAdmin(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const input = parseBody(reviewHideSchema, await readBody(event))
  const review = await adminService.hideReview(admin.id, id, input.reason)
  return { status: 'ok' as const, data: { review } }
}))
