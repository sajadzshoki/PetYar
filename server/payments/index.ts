import { DEFAULT_PLATFORM_FEE_BPS } from '../../shared/constants/payments'
import { createUnavailableGateway } from './unavailable.adapter'
import { createZarinpalGateway } from './zarinpal.adapter'
import type { PaymentGateway } from './types'

let instance: PaymentGateway | null = null

export function paymentFeeBps(): number {
  const raw = Number(process.env.PAYMENT_PLATFORM_FEE_BPS || DEFAULT_PLATFORM_FEE_BPS)
  if (!Number.isInteger(raw) || raw < 0 || raw > 10_000) return DEFAULT_PLATFORM_FEE_BPS
  return raw
}

export function getPaymentGateway(): PaymentGateway {
  if (instance) return instance

  const driver = (process.env.PAYMENT_DRIVER || 'zarinpal').trim()
  const merchant = (process.env.ZARINPAL_MERCHANT_ID || '').trim()

  if (driver === 'unavailable' || !merchant) {
    instance = createUnavailableGateway(
      merchant
        ? 'درگاه پرداخت غیرفعال است'
        : 'درگاه پرداخت پیکربندی نشده است. شناسه پذیرنده تنظیم نشده.',
    )
    return instance
  }

  if (driver === 'zarinpal') {
    instance = createZarinpalGateway({
      merchantId: merchant,
      sandbox: process.env.ZARINPAL_SANDBOX === 'true',
    })
    return instance
  }

  instance = createUnavailableGateway(`راننده پرداخت ناشناخته: ${driver}`)
  return instance
}

export function resetPaymentGateway() {
  instance = null
}

export type { PaymentGateway } from './types'
