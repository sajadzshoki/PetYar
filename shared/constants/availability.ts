export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const
export type Weekday = (typeof WEEKDAYS)[number]

/** JS getDay(): 0 Sunday … 6 Saturday. Display order for Iran: Saturday first. */
export const WEEKDAY_ORDER: Weekday[] = [6, 0, 1, 2, 3, 4, 5]

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'یکشنبه',
  1: 'دوشنبه',
  2: 'سه‌شنبه',
  3: 'چهارشنبه',
  4: 'پنجشنبه',
  5: 'جمعه',
  6: 'شنبه',
}

export const EXCEPTION_KINDS = ['BLOCK', 'OPEN'] as const
export type ExceptionKind = (typeof EXCEPTION_KINDS)[number]

export const PROVIDER_TIMEZONE = 'Asia/Tehran'

export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
