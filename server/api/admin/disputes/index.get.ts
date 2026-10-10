import { handleApi } from '../../../utils/api-response'
import { requireAdmin } from '../../../utils/authorization'
import { disputeService } from '../../../services/dispute.service'

export default defineEventHandler(event => handleApi(async () => {
  await requireAdmin(event as never)
  const disputes = await disputeService.listAll()
  return { status: 'ok' as const, data: { disputes } }
}))
