import { handleApi } from '../../../utils/api-response'
import { requireAdmin } from '../../../utils/authorization'
import { verificationService } from '../../../services/verification.service'

export default defineEventHandler(event => handleApi(async () => {
  await requireAdmin(event as never)
  const applications = await verificationService.listPending()
  return { status: 'ok' as const, data: { applications } }
}))
