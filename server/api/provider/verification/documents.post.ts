import { handleApi } from '../../../utils/api-response'
import { requireAuth } from '../../../utils/authorization'
import { verificationService } from '../../../services/verification.service'
import { validationError } from '../../../utils/errors'
import { assertImageUpload } from '../../../utils/media'
import type { VerificationDocumentKind } from '../../../../shared/constants/moderation'
import { VERIFICATION_DOCUMENT_KINDS } from '../../../../shared/constants/moderation'

export default defineEventHandler(event => handleApi(async () => {
  const session = await requireAuth(event as never)
  const form = await readMultipartFormData(event)
  const file = form?.find(part => part.name === 'file' && part.data)
  if (!file) throw validationError({ field: 'file' }, 'فایل تصویر الزامی است')
  const kindRaw = form?.find(part => part.name === 'kind')?.data?.toString() || 'NATIONAL_ID'
  const kind = (VERIFICATION_DOCUMENT_KINDS as readonly string[]).includes(kindRaw)
    ? kindRaw as VerificationDocumentKind
    : 'OTHER'
  const contentType = assertImageUpload({ type: file.type, data: file.data, filename: file.filename })
  const application = await verificationService.addDocument(session.id, kind, Buffer.from(file.data), contentType)
  return { status: 'ok' as const, data: { application } }
}))
