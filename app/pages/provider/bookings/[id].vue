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
const note = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { booking: Booking } }>(`/api/provider/bookings/${id.value}`)
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

async function openChat() {
  if (!booking.value) return
  try {
    const res = await $fetch<{ data: { conversation: { id: string } } }>(`/api/bookings/${booking.value.id}/conversation`)
    await navigateTo(`/inbox/${res.data.conversation.id}`)
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'گفتگو باز نشد')
  }
}

async function act(action: string, body?: Record<string, string>) {
  if (!booking.value) return
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { booking: Booking } }>(`/api/provider/bookings/${booking.value.id}/${action}`, {
      method: 'POST',
      body,
    })
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
  if (b.negotiable || b.totalAmount == null) return 'توافقی'
  return `${new Intl.NumberFormat('fa-IR').format(b.totalAmount)} تومان`
}

function when(iso: string) {
  return new Date(iso).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-12">
    <NuxtLink to="/provider/bookings" class="text-sm text-ink-600">درخواست‌ها</NuxtLink>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <AppState v-else-if="!booking" :title="error || 'رزرو یافت نشد'" />
    <template v-else>
      <h1 class="mt-3 text-2xl font-semibold">{{ booking.serviceTitle }}</h1>
      <p class="mt-2 text-sm text-ink-600">حیوان: {{ booking.petName }}</p>
      <p class="mt-3 text-sm leading-7">{{ when(booking.startAt) }} تا {{ when(booking.endAt) }}</p>
      <p class="mt-2 text-sm font-medium">{{ BOOKING_STATUS_LABELS[booking.status] }}</p>
      <p class="mt-2 text-sm">{{ money(booking) }}</p>
      <p v-if="booking.payment?.status === 'PAID' || booking.payment?.status === 'PARTIALLY_REFUNDED'" class="mt-2 text-sm text-ink-700">
        سهم شما پس از کارمزد: {{ new Intl.NumberFormat('fa-IR').format(booking.payment.providerPayout) }} تومان
      </p>
      <p v-else-if="booking.payment" class="mt-2 text-sm text-ink-500">وضعیت پرداخت: {{ booking.payment.status }}</p>
      <p v-else class="mt-2 text-xs text-ink-500">تا پرداخت تأیید نشود، خدمت را شروع نکنید.</p>
      <p v-if="booking.ownerNote" class="mt-4 text-sm leading-7">یادداشت صاحب: {{ booking.ownerNote }}</p>
      <p v-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
      <UButton class="mt-4" color="neutral" variant="outline" @click="openChat">گفتگو با صاحب</UButton>

      <div class="mt-8 flex flex-col gap-3">
        <UButton v-if="booking.status === 'PENDING'" :loading="pending" @click="act('accept', { note })">پذیرش</UButton>
        <UButton
          v-if="booking.status === 'PENDING'"
          color="neutral"
          variant="outline"
          :loading="pending"
          @click="act('reject', { reason })"
        >
          رد
        </UButton>
        <UButton v-if="booking.status === 'ACCEPTED'" :loading="pending" @click="act('confirm')">تأیید نهایی</UButton>
        <UButton v-if="booking.status === 'CONFIRMED'" :loading="pending" @click="act('start')">شروع خدمت</UButton>
        <UButton v-if="booking.status === 'IN_PROGRESS'" :loading="pending" @click="act('complete')">اتمام</UButton>
        <UButton
          v-if="['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status)"
          color="neutral"
          variant="outline"
          :loading="pending"
          :disabled="reason.trim().length < 3"
          @click="act('cancel', { reason })"
        >
          لغو
        </UButton>
        <UButton
          v-if="['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status)"
          color="neutral"
          variant="ghost"
          :loading="pending"
          :disabled="reason.trim().length < 3"
          @click="act('dispute', { reason })"
        >
          اختلاف
        </UButton>
        <UInput v-model="note" class="w-full" placeholder="پیام برای صاحب (اختیاری)" />
        <UInput v-model="reason" class="w-full" placeholder="دلیل رد، لغو یا اختلاف" />
      </div>
    </template>
  </div>
</template>
