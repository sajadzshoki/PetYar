/** Minutes from 00:00 for HH:MM (local wall clock). */
export function timeToMinutes(value: string): number {
  const [h, m] = value.slice(0, 5).split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export interface MinuteRange {
  start: number
  end: number
}

export function rangesOverlap(a: MinuteRange, b: MinuteRange) {
  return a.start < b.end && b.start < a.end
}

export function mergeRanges(ranges: MinuteRange[]): MinuteRange[] {
  if (ranges.length === 0) return []
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end)
  const out: MinuteRange[] = []
  let current = { ...sorted[0]! }
  for (const next of sorted.slice(1)) {
    if (next.start <= current.end) {
      current.end = Math.max(current.end, next.end)
    }
    else {
      out.push(current)
      current = { ...next }
    }
  }
  out.push(current)
  return out
}

export function subtractRanges(base: MinuteRange[], blocked: MinuteRange[]): MinuteRange[] {
  let remaining = mergeRanges(base)
  for (const block of blocked) {
    const next: MinuteRange[] = []
    for (const slot of remaining) {
      if (!rangesOverlap(slot, block)) {
        next.push(slot)
        continue
      }
      if (slot.start < block.start) {
        next.push({ start: slot.start, end: Math.min(slot.end, block.start) })
      }
      if (slot.end > block.end) {
        next.push({ start: Math.max(slot.start, block.end), end: slot.end })
      }
    }
    remaining = next.filter(r => r.end - r.start >= 1)
  }
  return remaining
}

export function rangeContained(haystack: MinuteRange[], needle: MinuteRange) {
  return haystack.some(slot => slot.start <= needle.start && slot.end >= needle.end)
}
