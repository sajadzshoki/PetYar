import type { BookingStatus } from '~~/shared/constants/bookings'
import type { PaymentStatus } from '~~/shared/constants/payments'
import type { DisputeStatus, ReportStatus, UserStatus, VerificationStatus } from '~~/shared/constants/moderation'
import type { PetType } from '~~/shared/constants/pets'

export interface NavItem {
  to: string
  label: string
  icon: string
  /** Match only the exact path (for index routes). */
  exact?: boolean
  /** Extra paths that should also highlight this item. */
  also?: string[]
}

export function isNavActive(path: string, item: NavItem): boolean {
  const matches = (base: string) => path === base || path.startsWith(`${base}/`)
  if (item.exact) {
    if (path === item.to) return true
    return (item.also || []).some(matches)
  }
  return matches(item.to) || (item.also || []).some(matches)
}

/** Bottom navigation for owners / customers (authenticated). */
export const CUSTOMER_TABS: NavItem[] = [
  { to: '/', label: 'خانه', icon: 'i-lucide-house', exact: true },
  { to: '/providers', label: 'جستجو', icon: 'i-lucide-search' },
  { to: '/bookings', label: 'رزروها', icon: 'i-lucide-calendar-check' },
  { to: '/inbox', label: 'پیام‌ها', icon: 'i-lucide-message-circle' },
  { to: '/account', label: 'پروفایل', icon: 'i-lucide-user-round', also: ['/pets', '/favorites', '/notifications', '/report'] },
]

/** Bottom navigation for visitors. */
export const GUEST_TABS: NavItem[] = [
  { to: '/', label: 'خانه', icon: 'i-lucide-house', exact: true },
  { to: '/providers', label: 'جستجو', icon: 'i-lucide-search' },
  { to: '/login', label: 'ورود', icon: 'i-lucide-log-in', also: ['/register'] },
]

/** Provider workspace — primary destinations (bottom nav + desktop tabs). */
export const PROVIDER_TABS: NavItem[] = [
  { to: '/provider', label: 'کارتابل', icon: 'i-lucide-layout-dashboard', exact: true },
  { to: '/provider/bookings', label: 'رزروها', icon: 'i-lucide-calendar-check' },
  { to: '/provider/availability', label: 'تقویم', icon: 'i-lucide-calendar-days' },
  { to: '/provider/services', label: 'خدمات', icon: 'i-lucide-briefcase' },
]

/** Provider workspace — secondary destinations (the "more" sheet / desktop tabs). */
export const PROVIDER_MORE: NavItem[] = [
  { to: '/provider/profile', label: 'پرونده عمومی', icon: 'i-lucide-id-card' },
  { to: '/provider/reviews', label: 'نظرها', icon: 'i-lucide-star' },
  { to: '/provider/earnings', label: 'درآمد', icon: 'i-lucide-wallet' },
  { to: '/provider/transactions', label: 'تراکنش‌ها', icon: 'i-lucide-receipt' },
  { to: '/provider/verification', label: 'احراز هویت', icon: 'i-lucide-badge-check' },
  { to: '/provider/settings', label: 'حساب کاربری', icon: 'i-lucide-settings' },
]

export const ADMIN_LINKS: NavItem[] = [
  { to: '/admin', label: 'نمای کلی', icon: 'i-lucide-layout-dashboard', exact: true },
  { to: '/admin/users', label: 'کاربران', icon: 'i-lucide-users' },
  { to: '/admin/providers', label: 'ارائه‌دهندگان', icon: 'i-lucide-store' },
  { to: '/admin/verifications', label: 'احراز هویت', icon: 'i-lucide-badge-check' },
  { to: '/admin/bookings', label: 'رزروها', icon: 'i-lucide-calendar-check' },
  { to: '/admin/reports', label: 'گزارش‌ها', icon: 'i-lucide-flag' },
  { to: '/admin/disputes', label: 'اختلاف‌ها', icon: 'i-lucide-scale' },
  { to: '/admin/reviews', label: 'نظرها', icon: 'i-lucide-star' },
  { to: '/admin/audit', label: 'ممیزی', icon: 'i-lucide-scroll-text' },
]

/** Service category slugs → Lucide icons (single icon family across the app). */
export const CATEGORY_ICONS: Record<string, string> = {
  'pet-sitting': 'i-lucide-house-heart',
  'dog-walking': 'i-lucide-footprints',
  'pet-boarding': 'i-lucide-bed-double',
  'grooming': 'i-lucide-scissors',
  'pet-taxi': 'i-lucide-car-front',
  'veterinary': 'i-lucide-stethoscope',
  'training': 'i-lucide-graduation-cap',
  'home-pet-care': 'i-lucide-hand-heart',
}

export function categoryIcon(slug: string | null | undefined): string {
  return (slug && CATEGORY_ICONS[slug]) || 'i-lucide-paw-print'
}

export const PET_TYPE_ICONS: Record<PetType, string> = {
  DOG: 'i-lucide-dog',
  CAT: 'i-lucide-cat',
  BIRD: 'i-lucide-bird',
  RABBIT: 'i-lucide-rabbit',
  RODENT: 'i-lucide-rat',
  OTHER: 'i-lucide-paw-print',
}

export type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

export interface StatusMeta {
  color: BadgeColor
  icon: string
}

export const BOOKING_STATUS_META: Record<BookingStatus, StatusMeta> = {
  PENDING: { color: 'warning', icon: 'i-lucide-clock' },
  ACCEPTED: { color: 'primary', icon: 'i-lucide-thumbs-up' },
  REJECTED: { color: 'error', icon: 'i-lucide-x-circle' },
  CONFIRMED: { color: 'success', icon: 'i-lucide-check-circle-2' },
  IN_PROGRESS: { color: 'secondary', icon: 'i-lucide-loader' },
  COMPLETED: { color: 'success', icon: 'i-lucide-check-check' },
  CANCELLED: { color: 'neutral', icon: 'i-lucide-ban' },
  DISPUTED: { color: 'error', icon: 'i-lucide-triangle-alert' },
}

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  PENDING: { color: 'warning', icon: 'i-lucide-clock' },
  PROCESSING: { color: 'warning', icon: 'i-lucide-loader' },
  PAID: { color: 'success', icon: 'i-lucide-check-circle-2' },
  FAILED: { color: 'error', icon: 'i-lucide-x-circle' },
  REFUNDED: { color: 'neutral', icon: 'i-lucide-undo-2' },
  PARTIALLY_REFUNDED: { color: 'neutral', icon: 'i-lucide-undo-2' },
}

export const VERIFICATION_STATUS_META: Record<VerificationStatus, StatusMeta> = {
  UNVERIFIED: { color: 'neutral', icon: 'i-lucide-shield' },
  PENDING: { color: 'warning', icon: 'i-lucide-clock' },
  NEEDS_CHANGES: { color: 'warning', icon: 'i-lucide-pencil-line' },
  APPROVED: { color: 'success', icon: 'i-lucide-badge-check' },
  REJECTED: { color: 'error', icon: 'i-lucide-shield-x' },
}

export const REPORT_STATUS_META: Record<ReportStatus, StatusMeta> = {
  OPEN: { color: 'warning', icon: 'i-lucide-flag' },
  IN_REVIEW: { color: 'primary', icon: 'i-lucide-eye' },
  RESOLVED: { color: 'success', icon: 'i-lucide-check-circle-2' },
  DISMISSED: { color: 'neutral', icon: 'i-lucide-ban' },
}

export const DISPUTE_STATUS_META: Record<DisputeStatus, StatusMeta> = {
  OPEN: { color: 'warning', icon: 'i-lucide-scale' },
  IN_REVIEW: { color: 'primary', icon: 'i-lucide-eye' },
  RESOLVED: { color: 'success', icon: 'i-lucide-check-circle-2' },
  DISMISSED: { color: 'neutral', icon: 'i-lucide-ban' },
}

export const USER_STATUS_META: Record<UserStatus, StatusMeta> = {
  ACTIVE: { color: 'success', icon: 'i-lucide-check-circle-2' },
  SUSPENDED: { color: 'error', icon: 'i-lucide-ban' },
  DEACTIVATED: { color: 'neutral', icon: 'i-lucide-circle-off' },
}

export const USER_ROLE_LABELS: Record<string, string> = {
  OWNER: 'صاحب حیوان',
  PROVIDER: 'ارائه‌دهنده',
  ADMIN: 'مدیر',
}
