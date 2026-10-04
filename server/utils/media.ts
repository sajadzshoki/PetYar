import { randomUUID } from 'node:crypto'
import { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from '../../shared/constants/pets'
import { validationError } from './errors'

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function assertImageUpload(file: { type?: string, data: Buffer, filename?: string }) {
  const type = file.type || ''
  if (!(IMAGE_MIME_TYPES as readonly string[]).includes(type)) {
    throw validationError({ field: 'file' }, 'فقط تصویر JPEG، PNG یا WebP پذیرفته می‌شود')
  }
  if (file.data.length === 0 || file.data.length > MAX_IMAGE_BYTES) {
    throw validationError({ field: 'file' }, 'حجم تصویر باید کمتر از ۲ مگابایت باشد')
  }
  return type
}

export function mediaKey(prefix: string, contentType: string) {
  const ext = EXT[contentType] || 'bin'
  return `${prefix}/${randomUUID()}.${ext}`
}

export function mediaUrl(key: string | null | undefined): string | null {
  if (!key) return null
  return `/api/media/${key}`
}

export function contentTypeFromKey(key: string) {
  if (key.endsWith('.png')) return 'image/png'
  if (key.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

export function isPublicMedia(key: string) {
  return key.startsWith('providers/')
}

export function canAccessMedia(userId: string, key: string) {
  return isPublicMedia(key)
    || key.startsWith(`avatars/${userId}/`)
    || key.startsWith(`pets/${userId}/`)
    || key.startsWith('messages/')
}

export function isMessageMedia(key: string) {
  return key.startsWith('messages/')
}
