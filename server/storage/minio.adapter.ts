/**
 * MinIO adapter placeholder.
 * Phase 01 ships a driver-ready interface; the S3 client is wired when
 * STORAGE_DRIVER=minio and credentials are present.
 */
import type { ObjectStorage } from './types'

export interface MinioConfig {
  endpoint: string
  port: number
  useSSL: boolean
  accessKey: string
  secretKey: string
  bucket: string
}

export function createMinioStorage(_config: MinioConfig): ObjectStorage {
  throw new Error('MinIO adapter is not enabled in phase 01. Set STORAGE_DRIVER=local.')
}
