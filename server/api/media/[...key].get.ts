import { getSessionUser } from '../../utils/authorization'
import { AppError, forbidden, notFound } from '../../utils/errors'
import { getObjectStorage } from '../../storage'
import { canAccessMedia, contentTypeFromKey, isMessageMedia, isPublicMedia } from '../../utils/media'
import { messagingService } from '../../services/messaging.service'
import { HTTP_STATUS } from '../../../shared/constants/api'

export default defineEventHandler(async (event) => {
  try {
    const raw = getRouterParam(event, 'key')
    const key = Array.isArray(raw) ? raw.join('/') : (raw || '')
    if (!key || key.includes('..')) throw forbidden()

    if (!isPublicMedia(key)) {
      const session = await getSessionUser(event as never)
      if (!session) throw forbidden()
      if (key.startsWith('verification/')) {
        if (session.role !== 'ADMIN') {
          const { providerService } = await import('../../services/provider.service')
          const provider = await providerService.getByUserId(session.id)
          if (!provider || !key.startsWith(`verification/${provider.id}/`)) throw forbidden()
        }
      }
      else if (isMessageMedia(key)) {
        if (!await messagingService.canAccessAttachment(session.id, key)) throw forbidden()
      }
      else if (!canAccessMedia(session.id, key)) throw forbidden()
    }

    const body = await getObjectStorage().get(key)
    if (!body) throw notFound('فایل یافت نشد')

    setHeader(event, 'Content-Type', contentTypeFromKey(key))
    setHeader(event, 'Cache-Control', isPublicMedia(key) ? 'public, max-age=3600' : 'private, max-age=3600')
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
