import type { PricingType } from '../constants/providers'

export interface PriceQuote {
  pricingType: PricingType
  unitPrice: number | null
  durationMinutes: number
  units: number
  totalAmount: number | null
  negotiable: boolean
}

export function durationMinutesBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
}

export function quotePrice(pricingType: PricingType, unitPrice: number | null, start: Date, end: Date): PriceQuote {
  const durationMinutes = durationMinutesBetween(start, end)
  if (pricingType === 'CUSTOM' || unitPrice == null) {
    return {
      pricingType,
      unitPrice: null,
      durationMinutes,
      units: 0,
      totalAmount: null,
      negotiable: true,
    }
  }

  let units = 1
  if (pricingType === 'HOURLY') {
    units = Math.max(1, Math.ceil(durationMinutes / 60))
  }
  else if (pricingType === 'DAILY') {
    units = Math.max(1, Math.ceil(durationMinutes / (24 * 60)))
  }

  return {
    pricingType,
    unitPrice,
    durationMinutes,
    units,
    totalAmount: units * unitPrice,
    negotiable: false,
  }
}
