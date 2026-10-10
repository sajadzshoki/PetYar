import { randomUUID } from 'node:crypto'
import { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from '../../shared/constants/pets'
import { validationError } from './errors'

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function sniffImageType(data: Buffer): string | null {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'image/jpeg'
  if (data.length >= 8 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return 'image/png'
  if (data.length >= 12 && data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp'
  }
  return null
}

export function assertImageUpload(file: { type?: string, data: Buffer, filename?: string }) {
  if (file.data.length === 0 || file.data.length > MAX_IMAGE_BYTES) {
    throw validationError({ field: 'file' }, 'حجم تصویر باید کمتر از ۲ مگابایت باشد')
  }
  const sniffed = sniffImageType(file.data)
  if (!sniffed || !(IMAGE_MIME_TYPES as readonly string[]).includes(sniffed)) {
    throw validationError({ field: 'file' }, 'فقط تصویر JPEG، PNG یا WebP پذیرفته می‌شود')
  }
  return sniffed
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
}

export function isMessageMedia(key: string) {
  return key.startsWith('messages/')
}
