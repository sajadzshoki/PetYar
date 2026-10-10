import { handleApi } from '../../utils/api-response'
import { requireAuth } from '../../utils/authorization'
import { validationError } from '../../utils/errors'
import { assertImageUpload } from '../../utils/media'
import { providerService } from '../../services/provider.service'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const form = await readMultipartFormData(event)
  const file = form?.find(part => part.name === 'file' && part.data)
  if (!file) throw validationError({ field: 'file' }, 'فایل تصویر الزامی است')
  const contentType = assertImageUpload({ type: file.type, data: file.data, filename: file.filename })
  const provider = await providerService.setPhoto(session.id, Buffer.from(file.data), contentType)
  return { status: 'ok' as const, data: { provider } }
}))
