import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { parseBody } from '../../utils/validate'
import { petWriteSchema, uuidParamSchema } from '../../../shared/validation/pet'
import { petService } from '../../services/pet.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const input = parseBody(petWriteSchema, await readBody(event))
  const pet = await petService.update(session.id, id, input)
  return { status: 'ok' as const, data: { pet } }
}))
