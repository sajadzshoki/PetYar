import type { PaymentGateway, PaymentRefundGatewayResult, PaymentRequestResult, PaymentVerifyResult } from './types'

export function createUnavailableGateway(reason: string): PaymentGateway {
  return {
    id: 'unavailable',
    configured: false,
    unavailableReason: reason,
    async requestPayment(): Promise<PaymentRequestResult> {
      return { configured: false, authority: null, redirectUrl: null, message: reason }
    },
    async verifyPayment(): Promise<PaymentVerifyResult> {
      return { ok: false, reference: null, message: reason }
    },
    async refundPayment(): Promise<PaymentRefundGatewayResult> {
      return { ok: false, reference: null, message: reason }
    },
  }
}
