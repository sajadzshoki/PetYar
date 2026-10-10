import { handleApi } from '../../../utils/api-response'
import { requireAuth } from '../../../utils/authorization'
import { parseBody } from '../../../utils/validate'
import { uuidParamSchema } from '../../../../shared/validation/pet'
import { validationError } from '../../../utils/errors'
import { assertImageUpload } from '../../../utils/media'
import { messagingService } from '../../../services/messaging.service'
import { HTTP_STATUS } from '../../../../shared/constants/api'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const id = parseBody(uuidParamSchema, getRouterParam(event, 'id'))
  const form = await readMultipartFormData(event)
  const file = form?.find(part => part.name === 'file' && part.data)
  if (!file) throw validationError({ field: 'file' }, 'فایل تصویر الزامی است')
  const contentType = assertImageUpload({ type: file.type, data: file.data, filename: file.filename })
  const captionPart = form?.find(part => part.name === 'body')
  const caption = captionPart?.data ? Buffer.from(captionPart.data).toString('utf8') : ''
  const message = await messagingService.attach(session.id, id, Buffer.from(file.data), contentType, caption)
  setResponseStatus(HTTP_STATUS.CREATED)
  return { status: 'ok' as const, data: { message } }
}))
