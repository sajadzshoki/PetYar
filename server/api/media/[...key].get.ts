import { requireAuth } from '../../utils/authorization'
import { AppError, forbidden, notFound } from '../../utils/errors'
import { getObjectStorage } from '../../storage'
import { canAccessMedia, contentTypeFromKey } from '../../utils/media'
import { HTTP_STATUS } from '../../../shared/constants/api'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireAuth(event as never)
    const raw = getRouterParam(event, 'key')
    const key = Array.isArray(raw) ? raw.join('/') : (raw || '')
    if (!key || key.includes('..')) throw forbidden()
    if (!canAccessMedia(session.id, key)) throw forbidden()

    const body = await getObjectStorage().get(key)
    if (!body) throw notFound('فایل یافت نشد')

    setHeader(event, 'Content-Type', contentTypeFromKey(key))
    setHeader(event, 'Cache-Control', 'private, max-age=3600')
    return body
  }
  catch (error) {
    if (error instanceof AppError) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.message,
        data: {
          status: 'error',
          error: { code: error.code, message: error.message },
        },
      })
    }
    throw createError({
      statusCode: HTTP_STATUS.INTERNAL,
      statusMessage: 'خطای داخلی سرور',
    })
  }
})
