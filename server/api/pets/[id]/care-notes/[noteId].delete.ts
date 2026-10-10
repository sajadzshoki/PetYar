import { handleApi } from '../../../../utils/api-response'
import { requireAuth } from '../../../../utils/authorization'
import { parseBody } from '../../../../utils/validate'
import { uuidParamSchema } from '../../../../../shared/validation/pet'
import { petService } from '../../../../services/pet.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const noteId = parseBody(uuidParamSchema, getRouterParam(event, 'noteId'))
  await petService.deleteCareNote(session.id, id, noteId)
  return { status: 'ok' as const, data: { deleted: true } }
}))
