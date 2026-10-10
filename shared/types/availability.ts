import type { ExceptionKind, Weekday } from '../constants/availability'

export interface AvailabilityRule {
  id: string
  weekday: Weekday
  startTime: string
  endTime: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AvailabilityException {
  id: string
  date: string
  kind: ExceptionKind
  startTime: string | null
  endTime: string | null
  note: string | null
  createdAt: string
}

export interface TimeSlot {
  startTime: string
  endTime: string
}

export interface CalendarDay {
  date: string
  weekday: Weekday
  blocked: boolean
  slots: TimeSlot[]
}

export interface AvailabilityCheck {
  available: boolean
  timezone: string
  localDate: string
  requested: TimeSlot
  reason?: string
}
