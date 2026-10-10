import assert from 'node:assert/strict'
import test from 'node:test'
import { MAX_IMAGE_BYTES } from '../../shared/constants/pets'
import { assertImageUpload, canAccessMedia, isMessageMedia, isPublicMedia } from '../../server/utils/media'
import { AppError } from '../../server/utils/errors'

test('rejects client MIME when bytes are not an image', () => {
  assert.throws(
    () => assertImageUpload({ type: 'image/jpeg', data: Buffer.from('not-an-image') }),
    (err: unknown) => err instanceof AppError && err.code === 'VALIDATION_ERROR',
  )
})

test('accepts sniffed jpeg regardless of declared type', () => {
  const type = assertImageUpload({
    type: 'application/octet-stream',
    data: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
  })
  assert.equal(type, 'image/jpeg')
})

test('rejects oversized buffers', () => {
  const data = Buffer.alloc(MAX_IMAGE_BYTES + 1, 0xff)
  data[0] = 0xff
  data[1] = 0xd8
  data[2] = 0xff
  assert.throws(
    () => assertImageUpload({ type: 'image/jpeg', data }),
    (err: unknown) => err instanceof AppError && err.code === 'VALIDATION_ERROR',
  )
})

test('message keys are not granted by canAccessMedia alone', () => {
  assert.equal(isMessageMedia('messages/abc.jpg'), true)
  assert.equal(canAccessMedia('user-1', 'messages/abc.jpg'), false)
  assert.equal(isPublicMedia('providers/x.jpg'), true)
  assert.equal(canAccessMedia('user-1', 'avatars/user-1/a.jpg'), true)
  assert.equal(canAccessMedia('user-1', 'avatars/user-2/a.jpg'), false)
})
