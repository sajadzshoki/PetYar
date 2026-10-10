import { handleApi } from '../../../../utils/api-response'
import { requireAdmin } from '../../../../utils/authorization'
import { verificationService } from '../../../../services/verification.service'
import { parseBody } from '../../../../utils/validate'
import { uuidParamSchema } from '../../../../../shared/validation/pet'
import { verificationReviewSchema } from '../../../../../shared/validation/moderation'

export default defineEventHandler(event => handleApi(async () => {
  const admin = await requireAdmin(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const input = parseBody(verificationReviewSchema, await readBody(event) || {})
  const application = await verificationService.review(admin.id, id, 'NEEDS_CHANGES', input.note)
  return { status: 'ok' as const, data: { application } }
}))
