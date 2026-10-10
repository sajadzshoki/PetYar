import { handleApi } from '../../../utils/api-response'
import { requireAuth } from '../../../utils/authorization'
import { verificationService } from '../../../services/verification.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const application = await verificationService.submitMine(session.id)
  return { status: 'ok' as const, data: { application } }
}))
