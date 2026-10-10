import { handleApi } from '../../../../utils/api-response'
import { requireAuth } from '../../../../utils/authorization'
import { parseBody } from '../../../../utils/validate'
import { uuidParamSchema } from '../../../../../shared/validation/pet'
import { petService } from '../../../../services/pet.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const vaccinationId = parseBody(uuidParamSchema, getRouterParam(event, 'vaccinationId'))
  await petService.deleteVaccination(session.id, id, vaccinationId)
  return { status: 'ok' as const, data: { deleted: true } }
}))
