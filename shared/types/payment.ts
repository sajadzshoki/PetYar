import type { PaymentStatus, PaymentTransactionType } from '../constants/payments'

export interface PaymentGatewayInfo {
  configured: boolean
  driver: string
  feeBps: number
  reason?: string
}

export interface Payment {
  id: string
  bookingId: string
  ownerId: string
  providerId: string
  status: PaymentStatus
  amount: number
  platformFee: number
  providerPayout: number
  refundedAmount: number
  currency: string
  driver: string
  authority: string | null
  reference: string | null
  redirectUrl: string | null
  configured: boolean
  errorMessage: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PaymentTransaction {
  id: string
  paymentId: string
  type: PaymentTransactionType
  amount: number
  currency: string
  status: PaymentStatus | 'RECORDED'
  idempotencyKey: string
  gatewayRef: string | null
  createdAt: string
}

export interface PaymentWithTransactions extends Payment {
  transactions: PaymentTransaction[]
}
