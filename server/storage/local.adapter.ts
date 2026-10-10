import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises'
import { dirname, join, normalize } from 'node:path'
import type { ObjectStorage, StoredObject } from './types'

export function createLocalStorage(rootDir: string): ObjectStorage {
  function resolveKey(key: string) {
    const safe = normalize(key).replace(/^(\.\.(\/|\\|$))+/, '')
    return join(rootDir, safe)
  }

  return {
    async put(key: string, body: Buffer, contentType: string): Promise<StoredObject> {
      const path = resolveKey(key)
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, body)
      return { key, contentType, size: body.length }
    },
    async get(key: string): Promise<Buffer | null> {
      try {
        return await readFile(resolveKey(key))
      }
      catch {
        return null
      }
    },
    async delete(key: string): Promise<void> {
      try {
        await unlink(resolveKey(key))
      }
      catch {
        // ignore missing
      }
    },
  }
}
