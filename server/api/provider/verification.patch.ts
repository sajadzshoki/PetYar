import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { verificationService } from '../../services/verification.service'
import { parseBody } from '../../utils/validate'
import { verificationWriteSchema } from '../../../shared/validation/moderation'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const input = parseBody(verificationWriteSchema, await readBody(event))
  const application = await verificationService.saveMine(session.id, input)
  return { status: 'ok' as const, data: { application } }
}))
