import { handleApi } from '../../../utils/api-response'
import { requireAuth } from '../../../utils/authorization'
import { parseBody } from '../../../utils/validate'
import { medicationWriteSchema, uuidParamSchema } from '../../../../shared/validation/pet'
import { petService } from '../../../services/pet.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const input = parseBody(medicationWriteSchema, await readBody(event))
  const medication = await petService.addMedication(session.id, id, input)
  return { status: 'ok' as const, data: { medication } }
}))
