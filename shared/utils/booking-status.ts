import type { BookingStatus } from '../constants/bookings'

/** True only when current status is an allowed source. Same-status is not implicitly allowed. */
export function canTransitionBooking(from: BookingStatus, _to: BookingStatus, allowedFrom: BookingStatus[]) {
  return allowedFrom.includes(from)
}
