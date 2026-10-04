<script setup lang="ts">
import type { Booking } from '~~/shared/types/booking'
import { BOOKING_STATUS_LABELS } from '~~/shared/constants/bookings'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const booking = ref<Booking | null>(null)
const loading = ref(true)
const pending = ref(false)
const error = ref('')
const reason = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { booking: Booking } }>(`/api/bookings/${id.value}`)
    booking.value = res.data.booking
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'رزرو یافت نشد')
    booking.value = null
  }
  finally {
    loading.value = false
  }
}

watch(id, load, { immediate: true })

async function act(path: string, body?: Record<string, string>) {
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { booking: Booking } }>(path, { method: 'POST', body })
    booking.value = res.data.booking
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'انجام نشد')
  }
  finally {
    pending.value = false
  }
}

function money(b: Booking) {
  if (b.negotiable || b.totalAmount == null) return 'توافقی — پرداخت در پت‌یار فعال نیست'
  return `${new Intl.NumberFormat('fa-IR').format(b.totalAmount)} تومان (پرداخت هنوز انجام نمی‌شود)`
}

function when(iso: string) {
  return new Date(iso).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-12">
    <NuxtLink to="/bookings" class="text-sm text-ink-600">رزروهای من</NuxtLink>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <AppState v-else-if="!booking" :title="error || 'رزرو یافت نشد'" />
    <template v-else>
      <h1 class="mt-3 text-2xl font-semibold">{{ booking.serviceTitle }}</h1>
      <p class="mt-2 text-sm text-ink-600">{{ booking.providerName }} · {{ booking.petName }}</p>
      <p class="mt-4 text-sm leading-7">
        {{ when(booking.startAt) }} تا {{ when(booking.endAt) }}
        <span class="block text-ink-500">وقت {{ booking.timezone }}</span>
      </p>
      <p class="mt-3 text-sm font-medium">{{ BOOKING_STATUS_LABELS[booking.status] }}</p>
      <p class="mt-2 text-sm text-ink-700">{{ money(booking) }}</p>
      <p v-if="booking.ownerNote" class="mt-4 text-sm leading-7 text-ink-600">یادداشت شما: {{ booking.ownerNote }}</p>
      <p v-if="booking.providerNote" class="mt-2 text-sm leading-7 text-ink-600">پیام ارائه‌دهنده: {{ booking.providerNote }}</p>
      <p v-if="booking.cancellationReason" class="mt-2 text-sm text-ink-600">{{ booking.cancellationReason }}</p>
      <p v-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>

      <div class="mt-8 space-y-3">
        <UButton
          v-if="booking.status === 'ACCEPTED'"
          :loading="pending"
          @click="act(`/api/bookings/${booking.id}/confirm`)"
        >
          تأیید نهایی
        </UButton>
        <UButton
          v-if="['PENDING', 'ACCEPTED', 'CONFIRMED'].includes(booking.status)"
          color="neutral"
          variant="outline"
          :loading="pending"
          :disabled="reason.trim().length < 3"
          @click="act(`/api/bookings/${booking.id}/cancel`, { reason })"
        >
          لغو رزرو
        </UButton>
        <UButton
          v-if="['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status)"
          color="neutral"
          variant="ghost"
          :loading="pending"
          :disabled="reason.trim().length < 3"
          @click="act(`/api/bookings/${booking.id}/dispute`, { reason })"
        >
          ثبت اختلاف
        </UButton>
        <UInput
          v-if="['PENDING', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status)"
          v-model="reason"
          class="w-full"
          placeholder="دلیل لغو یا اختلاف"
        />
      </div>
    </template>
  </div>
</template>
