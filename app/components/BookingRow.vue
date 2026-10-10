<script setup lang="ts">
import type { Booking } from '~~/shared/types/booking'
import { BOOKING_STATUS_LABELS } from '~~/shared/constants/bookings'

/**
 * Booking list item shared by the owner and provider lists.
 * `perspective` decides whether the counterpart shown is the provider or the pet owner/pet.
 */
const props = withDefaults(defineProps<{
  booking: Booking
  to: string
  perspective?: 'owner' | 'provider'
}>(), {
  perspective: 'owner',
})

const amount = computed(() => {
  if (props.booking.negotiable || props.booking.totalAmount == null) return 'توافقی'
  return formatToman(props.booking.totalAmount)
})

const counterpart = computed(() =>
  props.perspective === 'owner' ? props.booking.providerName : props.booking.petName,
)
</script>

<template>
  <NuxtLink
    :to="to"
    class="pressable surface group flex items-start gap-3.5 p-3.5 transition-colors hover:border-forest-300 sm:p-4"
  >
    <span class="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-canvas-deep text-highlighted">
      <span class="num text-lg font-extrabold leading-none">{{ formatDate(booking.startAt, { day: 'numeric', month: undefined, year: undefined }) }}</span>
      <span class="mt-0.5 text-[10px] font-semibold text-muted">{{ formatDate(booking.startAt, { month: 'short', day: undefined, year: undefined }) }}</span>
    </span>
    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-2">
        <h3 class="truncate text-base font-bold text-highlighted">{{ booking.serviceTitle }}</h3>
        <StatusBadge :label="BOOKING_STATUS_LABELS[booking.status]" :meta="BOOKING_STATUS_META[booking.status]" size="sm" class="shrink-0" />
      </div>
      <p class="mt-0.5 truncate text-sm text-muted">
        {{ counterpart }}<template v-if="perspective === 'owner'"> · {{ booking.petName }}</template>
      </p>
      <p class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
        <span class="inline-flex items-center gap-1 text-toned">
          <UIcon name="i-lucide-clock" class="size-3.5" aria-hidden="true" />
          <span class="num">{{ formatTime(booking.startAt) }}–{{ formatTime(booking.endAt) }}</span>
        </span>
        <span class="font-semibold text-highlighted">{{ amount }}</span>
      </p>
    </div>
    <UIcon name="i-lucide-chevron-left" class="mt-1 size-4 shrink-0 text-ink-300 transition-colors group-hover:text-ink-500" aria-hidden="true" />
  </NuxtLink>
</template>
