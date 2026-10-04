import { PROVIDER_TIMEZONE, type Weekday } from '../../shared/constants/availability'

export interface ZonedWallClock {
  date: string
  hours: number
  minutes: number
  weekday: Weekday
}

export function zonedWallClock(instant: Date, timeZone = PROVIDER_TIMEZONE): ZonedWallClock {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(instant)

  const map: Record<string, string> = {}
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value
  }

  const weekdayMap: Record<string, Weekday> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  return {
    date: `${map.year}-${map.month}-${map.day}`,
    hours: Number(map.hour),
    minutes: Number(map.minute),
    weekday: weekdayMap[map.weekday || 'Sun'] ?? 0,
  }
}

export function addUtcDays(dateYmd: string, days: number) {
  const [y, m, d] = dateYmd.split('-').map(Number)
  const utc = Date.UTC(y || 0, (m || 1) - 1, (d || 1) + days)
  const stamp = new Date(utc).toISOString().slice(0, 10)
  return stamp
}

export function eachDateInclusive(from: string, to: string): string[] {
  const out: string[] = []
  let cursor = from
  let guard = 0
  while (cursor <= to && guard < 400) {
    out.push(cursor)
    cursor = addUtcDays(cursor, 1)
    guard += 1
  }
  return out
}

export function weekdayFromYmd(dateYmd: string, timeZone = PROVIDER_TIMEZONE): Weekday {
  const noon = new Date(`${dateYmd}T12:00:00.000Z`)
  return zonedWallClock(noon, timeZone).weekday
}
