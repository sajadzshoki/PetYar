import { createLocalStorage } from './local.adapter'
import { createMinioStorage } from './minio.adapter'
import type { ObjectStorage } from './types'

let instance: ObjectStorage | null = null

export function getObjectStorage(): ObjectStorage {
  if (instance) return instance

  const driver = process.env.STORAGE_DRIVER || 'local'
  if (driver === 'minio') {
    instance = createMinioStorage({
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: Number(process.env.MINIO_PORT || 9000),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || '',
      bucket: process.env.MINIO_BUCKET || 'petyar',
    })
    return instance
  }

  instance = createLocalStorage(process.env.STORAGE_LOCAL_DIR || './storage/local')
  return instance
}

export type { ObjectStorage, StoredObject } from './types'
