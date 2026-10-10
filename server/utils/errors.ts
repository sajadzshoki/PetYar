import { HTTP_STATUS } from '../../shared/constants/api'

export class AppError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: unknown

  constructor(code: string, message: string, statusCode: number = HTTP_STATUS.BAD_REQUEST, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export function unauthorized(message = 'ورود لازم است') {
  return new AppError('UNAUTHORIZED', message, HTTP_STATUS.UNAUTHORIZED)
}

export function forbidden(message = 'دسترسی مجاز نیست') {
  return new AppError('FORBIDDEN', message, HTTP_STATUS.FORBIDDEN)
}

export function notFound(message = 'موردی یافت نشد') {
  return new AppError('NOT_FOUND', message, HTTP_STATUS.NOT_FOUND)
}

export function conflict(message: string) {
  return new AppError('CONFLICT', message, HTTP_STATUS.CONFLICT)
}

export function validationError(details: unknown, message = 'داده‌های ارسالی نامعتبر است') {
  return new AppError('VALIDATION_ERROR', message, HTTP_STATUS.UNPROCESSABLE, details)
}

export function tooManyRequests(message = 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید') {
  return new AppError('RATE_LIMITED', message, HTTP_STATUS.TOO_MANY)
}
