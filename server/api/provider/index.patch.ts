import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { parseBody } from '../../utils/validate'
import { providerWriteSchema } from '../../../shared/validation/provider'
import { providerService } from '../../services/provider.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const input = parseBody(providerWriteSchema, await readBody(event))
  const provider = await providerService.updateMine(session.id, input)
  return { status: 'ok' as const, data: { provider } }
}))
