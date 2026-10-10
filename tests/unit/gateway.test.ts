import assert from 'node:assert/strict'
import test from 'node:test'
import { createUnavailableGateway } from '../../server/payments/unavailable.adapter'

test('unavailable gateway never reports success', async () => {
  const gw = createUnavailableGateway('درگاه پرداخت پیکربندی نشده است')
  assert.equal(gw.configured, false)
  const req = await gw.requestPayment({
    amount: 10000,
    currency: 'IRR',
    description: 't',
    callbackUrl: 'http://localhost/cb',
    bookingId: 'b',
    paymentId: 'p',
  })
  assert.equal(req.authority, null)
  assert.equal(req.redirectUrl, null)
  const verify = await gw.verifyPayment({ authority: 'x', amount: 10000 })
  assert.equal(verify.ok, false)
  const refund = await gw.refundPayment({ authority: 'x', reference: 'r', amount: 10000 })
  assert.equal(refund.ok, false)
})
