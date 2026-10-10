import { AppError } from './errors'
import { HTTP_STATUS } from '../../shared/constants/api'
import type { ApiErrorBody, ApiSuccess } from '../../shared/types/api'
import { logger } from './logger'

export function success<T>(data: T): ApiSuccess<T> {
  return { status: 'ok', data }
}

export function toErrorBody(error: unknown): { body: ApiErrorBody, statusCode: number } {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: {
        status: 'error',
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    }
  }

  logger.error('unhandled_error', {
    message: error instanceof Error ? error.message : String(error),
  })

  return {
    statusCode: HTTP_STATUS.INTERNAL,
    body: {
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'خطای داخلی سرور',
      },
    },
  }
}

export async function handleApi<T>(fn: () => Promise<T>): Promise<T | ApiErrorBody> {
  try {
    return await fn()
  }
  catch (error) {
    const { body, statusCode } = toErrorBody(error)
    throw createError({
      statusCode,
      statusMessage: body.error.message,
      data: body,
    })
  }
}
