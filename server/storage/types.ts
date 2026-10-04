export interface StoredObject {
  key: string
  contentType: string
  size: number
}

export interface ObjectStorage {
  put(key: string, body: Buffer, contentType: string): Promise<StoredObject>
  get(key: string): Promise<Buffer | null>
  delete(key: string): Promise<void>
}
