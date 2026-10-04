import { and, asc, eq, gte, lte, ne } from 'drizzle-orm'
import { getDb } from '../db/client'
import { availabilityExceptions, availabilityRules } from '../db/schema'
import type { AvailabilityExceptionRow, AvailabilityRuleRow } from '../db/schema/availability'
import { providerService } from './provider.service'
import { conflict, notFound, validationError } from '../utils/errors'
import { logger } from '../utils/logger'
import { PROVIDER_TIMEZONE, type Weekday } from '../../shared/constants/availability'
import type { AvailabilityExceptionWriteInput, AvailabilityRuleWriteInput } from '../../shared/validation/availability'
import type {
  AvailabilityCheck,
  AvailabilityException,
  AvailabilityRule,
  CalendarDay,
  TimeSlot,
} from '../../shared/types/availability'
import { mergeRanges, minutesToTime, rangeContained, rangesOverlap, subtractRanges, timeToMinutes, type MinuteRange } from '../../shared/utils/intervals'
import { eachDateInclusive, weekdayFromYmd, zonedWallClock } from '../utils/timezone'

function hhmm(value: string | null): string | null {
  if (!value) return null
  return value.slice(0, 5)
}

function ymd(value: string | Date): string {
  if (typeof value === 'string') return value.slice(0, 10)
  return value.toISOString().slice(0, 10)
}

function toRule(row: AvailabilityRuleRow): AvailabilityRule {
  return {
    id: row.id,
    weekday: row.weekday as Weekday,
    startTime: hhmm(row.startTime) || '00:00',
    endTime: hhmm(row.endTime) || '00:00',
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toException(row: AvailabilityExceptionRow): AvailabilityException {
  return {
    id: row.id,
    date: ymd(row.date),
    kind: row.kind,
    startTime: hhmm(row.startTime),
    endTime: hhmm(row.endTime),
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  }
}

function toRange(start: string, end: string): MinuteRange {
  return { start: timeToMinutes(start), end: timeToMinutes(end) }
}

function slotsFromRanges(ranges: MinuteRange[]): TimeSlot[] {
  return mergeRanges(ranges).map(r => ({
    startTime: minutesToTime(r.start),
    endTime: minutesToTime(r.end),
  }))
}

/**
 * Reserved windows for a local date. Bookings (phase 06+) should append intervals here.
 */
export async function reservedIntervals(_providerId: string, _localDate: string): Promise<MinuteRange[]> {
  return []
}

function assertNoOverlap(existing: MinuteRange[], candidate: MinuteRange, message: string) {
  if (existing.some(r => rangesOverlap(r, candidate))) {
    throw conflict(message)
  }
}

export const availabilityService = {
  async listRules(userId: string): Promise<AvailabilityRule[]> {
    const provider = await providerService.requireOwned(userId)
    const db = getDb()
    const rows = await db.select().from(availabilityRules)
      .where(eq(availabilityRules.providerId, provider.id))
      .orderBy(asc(availabilityRules.weekday), asc(availabilityRules.startTime))
    return rows.map(toRule)
  },

  async createRule(userId: string, input: AvailabilityRuleWriteInput): Promise<AvailabilityRule> {
    const provider = await providerService.requireOwned(userId)
    const db = getDb()
    if (input.isActive) {
      const others = await db.select().from(availabilityRules).where(and(
        eq(availabilityRules.providerId, provider.id),
        eq(availabilityRules.weekday, input.weekday),
        eq(availabilityRules.isActive, true),
      ))
      assertNoOverlap(
        others.map(r => toRange(hhmm(r.startTime)!, hhmm(r.endTime)!)),
        toRange(input.startTime, input.endTime),
        'این بازه با ساعت کاری دیگری در همین روز هم‌پوشانی دارد',
      )
    }
    const [created] = await db.insert(availabilityRules).values({
      providerId: provider.id,
      weekday: input.weekday,
      startTime: input.startTime,
      endTime: input.endTime,
      isActive: input.isActive,
    }).returning()
    if (!created) throw new Error('Failed to create rule')
    logger.info('availability_rule_created', { providerId: provider.id, ruleId: created.id })
    return toRule(created)
  },

  async updateRule(userId: string, ruleId: string, input: AvailabilityRuleWriteInput): Promise<AvailabilityRule> {
    const provider = await providerService.requireOwned(userId)
    const db = getDb()
    const [existing] = await db.select().from(availabilityRules).where(and(
      eq(availabilityRules.id, ruleId),
      eq(availabilityRules.providerId, provider.id),
    )).limit(1)
    if (!existing) throw notFound('قانون یافت نشد')
    if (input.isActive) {
      const others = await db.select().from(availabilityRules).where(and(
        eq(availabilityRules.providerId, provider.id),
        eq(availabilityRules.weekday, input.weekday),
        eq(availabilityRules.isActive, true),
        ne(availabilityRules.id, ruleId),
      ))
      assertNoOverlap(
        others.map(r => toRange(hhmm(r.startTime)!, hhmm(r.endTime)!)),
        toRange(input.startTime, input.endTime),
        'این بازه با ساعت کاری دیگری در همین روز هم‌پوشانی دارد',
      )
    }
    const [updated] = await db.update(availabilityRules).set({
      weekday: input.weekday,
      startTime: input.startTime,
      endTime: input.endTime,
      isActive: input.isActive,
      updatedAt: new Date(),
    }).where(eq(availabilityRules.id, ruleId)).returning()
    if (!updated) throw notFound('قانون یافت نشد')
    return toRule(updated)
  },

  async deleteRule(userId: string, ruleId: string) {
    const provider = await providerService.requireOwned(userId)
    const db = getDb()
    const deleted = await db.delete(availabilityRules).where(and(
      eq(availabilityRules.id, ruleId),
      eq(availabilityRules.providerId, provider.id),
    )).returning()
    if (!deleted.length) throw notFound('قانون یافت نشد')
  },

  async listExceptions(userId: string, from?: string, to?: string): Promise<AvailabilityException[]> {
    const provider = await providerService.requireOwned(userId)
    const db = getDb()
    const filters = [eq(availabilityExceptions.providerId, provider.id)]
    if (from) filters.push(gte(availabilityExceptions.date, from))
    if (to) filters.push(lte(availabilityExceptions.date, to))
    const rows = await db.select().from(availabilityExceptions)
      .where(and(...filters))
      .orderBy(asc(availabilityExceptions.date), asc(availabilityExceptions.startTime))
    return rows.map(toException)
  },

  async createException(userId: string, input: AvailabilityExceptionWriteInput): Promise<AvailabilityException> {
    const provider = await providerService.requireOwned(userId)
    const start = input.startTime || null
    const end = input.endTime || null
    const db = getDb()
    if (input.kind === 'OPEN' && start && end) {
      const others = await db.select().from(availabilityExceptions).where(and(
        eq(availabilityExceptions.providerId, provider.id),
        eq(availabilityExceptions.date, input.date),
        eq(availabilityExceptions.kind, 'OPEN'),
      ))
      assertNoOverlap(
        others.filter(r => r.startTime && r.endTime).map(r => toRange(hhmm(r.startTime)!, hhmm(r.endTime)!)),
        toRange(start, end),
        'این بازه اضافه با مورد دیگری در همین تاریخ هم‌پوشانی دارد',
      )
    }
    const [created] = await db.insert(availabilityExceptions).values({
      providerId: provider.id,
      date: input.date,
      kind: input.kind,
      startTime: start,
      endTime: end,
      note: input.note ? input.note.trim() : null,
    }).returning()
    if (!created) throw new Error('Failed to create exception')
    logger.info('availability_exception_created', { providerId: provider.id, id: created.id })
    return toException(created)
  },

  async deleteException(userId: string, exceptionId: string) {
    const provider = await providerService.requireOwned(userId)
    const db = getDb()
    const deleted = await db.delete(availabilityExceptions).where(and(
      eq(availabilityExceptions.id, exceptionId),
      eq(availabilityExceptions.providerId, provider.id),
    )).returning()
    if (!deleted.length) throw notFound('استثنا یافت نشد')
  },

  async calendarForProvider(providerId: string, from: string, to: string): Promise<CalendarDay[]> {
    const dates = eachDateInclusive(from, to)
    if (dates.length > 62) {
      throw validationError({ field: 'to' }, 'بازه تقویم حداکثر ۶۲ روز است')
    }
    const db = getDb()
    const [rules, exceptions] = await Promise.all([
      db.select().from(availabilityRules).where(and(
        eq(availabilityRules.providerId, providerId),
        eq(availabilityRules.isActive, true),
      )),
      db.select().from(availabilityExceptions).where(and(
        eq(availabilityExceptions.providerId, providerId),
        gte(availabilityExceptions.date, from),
        lte(availabilityExceptions.date, to),
      )),
    ])
    const days: CalendarDay[] = []
    for (const date of dates) {
      const weekday = weekdayFromYmd(date)
      const slots = await this.slotsForDate(providerId, date, weekday, rules, exceptions)
      days.push({
        date,
        weekday,
        blocked: slots.length === 0,
        slots: slotsFromRanges(slots),
      })
    }
    return days
  },

  async calendarMine(userId: string, from: string, to: string): Promise<CalendarDay[]> {
    const provider = await providerService.requireOwned(userId)
    return this.calendarForProvider(provider.id, from, to)
  },

  async slotsForDate(
    providerId: string,
    date: string,
    weekday: Weekday,
    rules: AvailabilityRuleRow[],
    exceptions: AvailabilityExceptionRow[],
  ): Promise<MinuteRange[]> {
    const dayExceptions = exceptions.filter(e => ymd(e.date) === date)
    const fullBlock = dayExceptions.some(e => e.kind === 'BLOCK' && !e.startTime && !e.endTime)
    if (fullBlock) return []

    const weekly = rules
      .filter(r => r.isActive && r.weekday === weekday)
      .map(r => toRange(hhmm(r.startTime)!, hhmm(r.endTime)!))
    const openExtra = dayExceptions
      .filter(e => e.kind === 'OPEN' && e.startTime && e.endTime)
      .map(e => toRange(hhmm(e.startTime)!, hhmm(e.endTime)!))
    const blocks = dayExceptions
      .filter(e => e.kind === 'BLOCK' && e.startTime && e.endTime)
      .map(e => toRange(hhmm(e.startTime)!, hhmm(e.endTime)!))

    const reserved = await reservedIntervals(providerId, date)
    const merged = mergeRanges([...weekly, ...openExtra])
    return subtractRanges(merged, [...blocks, ...reserved])
  },

  async check(providerId: string, startIso: string, endIso: string): Promise<AvailabilityCheck> {
    const start = new Date(startIso)
    const end = new Date(endIso)
    const startLocal = zonedWallClock(start)
    const endLocal = zonedWallClock(end)
    const requested: TimeSlot = {
      startTime: minutesToTime(startLocal.hours * 60 + startLocal.minutes),
      endTime: minutesToTime(endLocal.hours * 60 + endLocal.minutes),
    }

    if (startLocal.date !== endLocal.date) {
      return {
        available: false,
        timezone: PROVIDER_TIMEZONE,
        localDate: startLocal.date,
        requested,
        reason: 'بازه باید در یک روز تقویمی تهران باشد',
      }
    }

    const needle = {
      start: startLocal.hours * 60 + startLocal.minutes,
      end: endLocal.hours * 60 + endLocal.minutes,
    }
    if (needle.end <= needle.start) {
      return {
        available: false,
        timezone: PROVIDER_TIMEZONE,
        localDate: startLocal.date,
        requested,
        reason: 'بازه زمانی نامعتبر است',
      }
    }

    const db = getDb()
    const [rules, exceptions] = await Promise.all([
      db.select().from(availabilityRules).where(and(
        eq(availabilityRules.providerId, providerId),
        eq(availabilityRules.isActive, true),
      )),
      db.select().from(availabilityExceptions).where(and(
        eq(availabilityExceptions.providerId, providerId),
        eq(availabilityExceptions.date, startLocal.date),
      )),
    ])
    const slots = await this.slotsForDate(providerId, startLocal.date, startLocal.weekday, rules, exceptions)
    const available = rangeContained(slots, needle)
    return {
      available,
      timezone: PROVIDER_TIMEZONE,
      localDate: startLocal.date,
      requested,
      reason: available ? undefined : 'در این بازه آزاد نیست',
    }
  },
}
