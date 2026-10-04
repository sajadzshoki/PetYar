import { logger } from '../utils/logger'
import type {
  PaymentGateway,
  PaymentRefundGatewayInput,
  PaymentRefundGatewayResult,
  PaymentRequestInput,
  PaymentRequestResult,
  PaymentVerifyInput,
  PaymentVerifyResult,
} from './types'

interface ZarinpalConfig {
  merchantId: string
  sandbox: boolean
}

export function createZarinpalGateway(config: ZarinpalConfig): PaymentGateway {
  const host = config.sandbox
    ? 'https://sandbox.zarinpal.com'
    : 'https://api.zarinpal.com'
  const startPay = config.sandbox
    ? 'https://sandbox.zarinpal.com/pg/StartPay/'
    : 'https://www.zarinpal.com/pg/StartPay/'

  return {
    id: 'zarinpal',
    configured: true,
    async requestPayment(input: PaymentRequestInput): Promise<PaymentRequestResult> {
      const res = await fetch(`${host}/pg/v4/payment/request.json`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          merchant_id: config.merchantId,
          amount: input.amount,
          callback_url: input.callbackUrl,
          description: input.description.slice(0, 255),
          metadata: { order_id: input.bookingId },
        }),
      })
      const body = await res.json().catch(() => ({})) as {
        data?: { code?: number, authority?: string }
        errors?: { message?: string }
      }
      const authority = body.data?.authority
      if (res.ok && body.data?.code === 100 && authority) {
        return {
          configured: true,
          authority,
          redirectUrl: `${startPay}${authority}`,
        }
      }
      const message = body.errors?.message || 'درگاه زرین‌پال درخواست را نپذیرفت'
      logger.warn('zarinpal_request_failed', { message })
      return { configured: true, authority: null, redirectUrl: null, message }
    },

    async verifyPayment(input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
      const res = await fetch(`${host}/pg/v4/payment/verify.json`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          merchant_id: config.merchantId,
          amount: input.amount,
          authority: input.authority,
        }),
      })
      const body = await res.json().catch(() => ({})) as {
        data?: { code?: number, ref_id?: number | string }
        errors?: { message?: string }
      }
      const code = body.data?.code
      if (res.ok && (code === 100 || code === 101) && body.data?.ref_id != null) {
        return { ok: true, reference: String(body.data.ref_id) }
      }
      return { ok: false, reference: null, message: body.errors?.message || 'تأیید پرداخت ناموفق بود' }
    },

    async refundPayment(_input: PaymentRefundGatewayInput): Promise<PaymentRefundGatewayResult> {
      return {
        ok: false,
        reference: null,
        message: 'بازپرداخت خودکار زرین‌پال در این فاز پیکربندی نشده است',
      }
    },
  }
}
