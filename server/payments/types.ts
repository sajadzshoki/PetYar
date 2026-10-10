export interface PaymentRequestInput {
  amount: number
  currency: string
  description: string
  callbackUrl: string
  bookingId: string
  paymentId: string
}

export interface PaymentRequestResult {
  configured: boolean
  authority: string | null
  redirectUrl: string | null
  message?: string
}

export interface PaymentVerifyInput {
  authority: string
  amount: number
}

export interface PaymentVerifyResult {
  ok: boolean
  reference: string | null
  message?: string
}

export interface PaymentRefundGatewayInput {
  authority: string | null
  reference: string | null
  amount: number
}

export interface PaymentRefundGatewayResult {
  ok: boolean
  reference: string | null
  message?: string
}

export interface PaymentGateway {
  id: string
  configured: boolean
  unavailableReason?: string
  requestPayment(input: PaymentRequestInput): Promise<PaymentRequestResult>
  verifyPayment(input: PaymentVerifyInput): Promise<PaymentVerifyResult>
  refundPayment(input: PaymentRefundGatewayInput): Promise<PaymentRefundGatewayResult>
}
