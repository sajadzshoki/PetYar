export const PAYMENT_STATUSES = [
  'PENDING',
  'PROCESSING',
  'PAID',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'در انتظار پرداخت',
  PROCESSING: 'در حال پردازش',
  PAID: 'پرداخت‌شده',
  FAILED: 'ناموفق',
  REFUNDED: 'بازپرداخت کامل',
  PARTIALLY_REFUNDED: 'بازپرداخت جزئی',
}

export const PAYMENT_TRANSACTION_TYPES = [
  'CHARGE',
  'PLATFORM_FEE',
  'PROVIDER_PAYOUT',
  'REFUND',
] as const

export type PaymentTransactionType = (typeof PAYMENT_TRANSACTION_TYPES)[number]

export const PAYMENT_TRANSACTION_LABELS: Record<PaymentTransactionType, string> = {
  CHARGE: 'دریافت از مشتری',
  PLATFORM_FEE: 'کارمزد پلتفرم',
  PROVIDER_PAYOUT: 'سهم ارائه‌دهنده',
  REFUND: 'بازپرداخت',
}

export const DEFAULT_PLATFORM_FEE_BPS = 1000

export const IRR_CURRENCY = 'IRR'
