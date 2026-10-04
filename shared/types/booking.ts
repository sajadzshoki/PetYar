import type { BookingStatus, CancelledBy } from '../constants/bookings'
import type { PricingType } from '../constants/providers'

export interface Booking {
  id: string
  ownerId: string
  petId: string
  petName: string
  providerId: string
  providerName: string
  serviceId: string
  serviceTitle: string
  status: BookingStatus
  startAt: string
  endAt: string
  timezone: string
  pricingType: PricingType
  unitPrice: number | null
  durationMinutes: number
  units: number
  totalAmount: number | null
  currency: string
  negotiable: boolean
  ownerNote: string | null
  providerNote: string | null
  cancellationReason: string | null
  cancelledBy: CancelledBy | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface BookingQuote {
  timezone: string
  available: boolean
  reason?: string
  pricingType: PricingType
  unitPrice: number | null
  durationMinutes: number
  units: number
  totalAmount: number | null
  negotiable: boolean
  startAt: string
  endAt: string
}
