/**
 * Presentation-only formatting helpers (fa-IR, Tehran time).
 * No business rules live here — amounts and dates arrive from the API.
 */
const TZ = 'Asia/Tehran'
const LOCALE = 'fa-IR'

const numberFormatter = new Intl.NumberFormat(LOCALE)

export function formatNumber(value: number | string | null | undefined): string {
  if (value == null || value === '') return '—'
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return String(value)
  return numberFormatter.format(n)
}

/** `۱۲۰٬۰۰۰ تومان` */
export function formatToman(value: number | string | null | undefined): string {
  if (value == null || value === '') return '—'
  return `${formatNumber(value)} تومان`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString(LOCALE, {
    timeZone: TZ,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(iso: string | null | undefined, options: Intl.DateTimeFormatOptions = {}): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(LOCALE, {
    timeZone: TZ,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  })
}

/** Short weekday + day/month, e.g. `شنبه ۲۰ مهر` */
export function formatDayShort(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(LOCALE, {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString(LOCALE, { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
}

/** Relative "x ago" for recent activity; falls back to a full date after a week. */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const diffMin = Math.round((Date.now() - then) / 60000)
  if (diffMin < 1) return 'همین حالا'
  if (diffMin < 60) return `${formatNumber(diffMin)} دقیقه پیش`
  const diffHour = Math.round(diffMin / 60)
  if (diffHour < 24) return `${formatNumber(diffHour)} ساعت پیش`
  const diffDay = Math.round(diffHour / 24)
  if (diffDay < 7) return `${formatNumber(diffDay)} روز پیش`
  return formatDate(iso)
}

/** A `YYYY-MM-DD` (Gregorian) calendar key → Persian date label. */
export function formatCalendarDay(ymd: string, options: Intl.DateTimeFormatOptions = {}): string {
  if (!ymd) return ''
  return new Date(`${ymd}T12:00:00+03:30`).toLocaleDateString(LOCALE, {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...options,
  })
}

/** `۱۲.۵` → one decimal rating string */
export function formatRating(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)
}

export function formatDistance(km: number | null | undefined): string {
  if (km == null) return ''
  if (km < 1) return `${formatNumber(Math.round(km * 1000))} متر`
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(km)} کیلومتر`
}

/** Initials-ish fallback for avatars: first letter of the name. */
export function initialOf(name: string | null | undefined): string {
  const trimmed = (name || '').trim()
  return trimmed ? trimmed[0]! : '؟'
}
