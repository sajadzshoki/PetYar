export const BOOKING_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED',
] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'در انتظار تأیید',
  ACCEPTED: 'پذیرفته‌شده',
  REJECTED: 'رد شده',
  CONFIRMED: 'تأیید نهایی',
  IN_PROGRESS: 'در حال انجام',
  COMPLETED: 'تمام‌شده',
  CANCELLED: 'لغو شده',
  DISPUTED: 'اختلاف',
}

/** Statuses that occupy the provider calendar. */
export const BOOKING_BUSY_STATUSES: BookingStatus[] = [
  'PENDING',
  'ACCEPTED',
  'CONFIRMED',
  'IN_PROGRESS',
  'DISPUTED',
]

export const CANCELLED_BY = ['OWNER', 'PROVIDER'] as const
export type CancelledBy = (typeof CANCELLED_BY)[number]

export const BOOKING_CURRENCY = 'IRR'
