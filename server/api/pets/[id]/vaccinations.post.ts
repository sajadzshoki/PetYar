import { handleApi } from '../../../utils/api-response'
import { requireAuth } from '../../../utils/authorization'
import { parseBody } from '../../../utils/validate'
import { uuidParamSchema, vaccinationWriteSchema } from '../../../../shared/validation/pet'
import { petService } from '../../../services/pet.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const input = parseBody(vaccinationWriteSchema, await readBody(event))
  const vaccination = await petService.addVaccination(session.id, id, input)
  return { status: 'ok' as const, data: { vaccination } }
}))
