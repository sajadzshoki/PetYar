import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { parseBody } from '../../utils/validate'
import { petWriteSchema } from '../../../shared/validation/pet'
import { petService } from '../../services/pet.service'
import { HTTP_STATUS } from '../../../shared/constants/api'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const input = parseBody(petWriteSchema, await readBody(event))
  const pet = await petService.create(session.id, input)
  setResponseStatus(HTTP_STATUS.CREATED)
  return { status: 'ok' as const, data: { pet } }
}))
