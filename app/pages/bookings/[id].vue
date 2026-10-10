<script setup lang="ts">
import type { Booking } from '~~/shared/types/booking'
import type { Payment } from '~~/shared/types/payment'
import type { Review } from '~~/shared/types/review'
import { BOOKING_STATUS_LABELS } from '~~/shared/constants/bookings'
import { PAYMENT_STATUS_LABELS } from '~~/shared/constants/payments'
import { REVIEW_DIMENSION_LABELS, REVIEW_DIMENSIONS, type ReviewDimension } from '~~/shared/constants/reviews'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const booking = ref<Booking | null>(null)
const loading = ref(true)
const pending = ref(false)
const error = ref('')
const reason = ref('')
const payPending = ref(false)
const payError = ref('')
const gatewayReason = ref('')
const reviewPending = ref(false)
const reviewError = ref('')
const reviewForm = reactive({
  overall: 5,
  communication: 5,
  quality: 5,
  punctuality: 5,
  care: 5,
  comment: '',
})

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
  if (b.negotiable || b.totalAmount == null) return 'توافقی — پرداخت آنلاین لازم نیست'
  return `${new Intl.NumberFormat('fa-IR').format(b.totalAmount)} تومان`
}

const canPay = computed(() => {
  const b = booking.value
  if (!b || b.negotiable || b.totalAmount == null) return false
  if (!['ACCEPTED', 'CONFIRMED'].includes(b.status)) return false
  const st = b.payment?.status
  return !st || st === 'PENDING' || st === 'FAILED' || st === 'PROCESSING'
})

async function startPay() {
  if (!booking.value) return
  payPending.value = true
  payError.value = ''
  gatewayReason.value = ''
  try {
    const res = await $fetch<{ data: { payment: Payment, gateway: { configured: boolean, reason?: string } } }>(
      `/api/bookings/${booking.value.id}/pay`,
      { method: 'POST' },
    )
    const payment = res.data.payment
    if (payment.redirectUrl) {
      window.location.href = payment.redirectUrl
      return
    }
    if (!res.data.gateway.configured) {
      gatewayReason.value = res.data.gateway.reason || payment.errorMessage || 'درگاه پرداخت پیکربندی نشده است'
      await load()
      return
    }
    if (payment.status === 'FAILED') {
      payError.value = payment.errorMessage || 'پرداخت ناموفق بود'
      await load()
      return
    }
    await navigateTo(`/payments/${payment.id}`)
  }
  catch (err) {
    payError.value = apiErrorMessage(err, 'شروع پرداخت ناموفق بود')
  }
  finally {
    payPending.value = false
  }
}

function when(iso: string) {
  return new Date(iso).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })
}

function setScore(key: ReviewDimension, value: number) {
  reviewForm[key] = value
}

async function submitReview() {
  if (!booking.value) return
  reviewPending.value = true
  reviewError.value = ''
  try {
    const res = await $fetch<{ data: { review: Review } }>(`/api/bookings/${booking.value.id}/review`, {
      method: 'POST',
      body: { ...reviewForm },
    })
    booking.value = { ...booking.value, review: res.data.review, canReview: false }
  }
  catch (err) {
    reviewError.value = apiErrorMessage(err, 'ثبت نظر ناموفق بود')
  }
  finally {
    reviewPending.value = false
  }
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
      <p v-if="booking.payment" class="mt-1 text-sm text-ink-600">
        پرداخت: {{ PAYMENT_STATUS_LABELS[booking.payment.status] }}
        <NuxtLink :to="`/payments/${booking.payment.id}`" class="mr-2 text-terracotta-700">جزئیات</NuxtLink>
      </p>
      <p v-if="gatewayReason" class="mt-3 text-sm leading-7 text-terracotta-700">{{ gatewayReason }}</p>
      <p v-if="payError" class="mt-3 text-sm text-terracotta-700">{{ payError }}</p>
      <UButton v-if="canPay" class="mt-4" :loading="payPending" @click="startPay">پرداخت</UButton>
      <p v-if="booking.ownerNote" class="mt-4 text-sm leading-7 text-ink-600">یادداشت شما: {{ booking.ownerNote }}</p>
      <p v-if="booking.providerNote" class="mt-2 text-sm leading-7 text-ink-600">پیام ارائه‌دهنده: {{ booking.providerNote }}</p>
      <p v-if="booking.cancellationReason" class="mt-2 text-sm text-ink-600">{{ booking.cancellationReason }}</p>
      <p v-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
      <UButton class="mt-6" color="neutral" variant="outline" @click="openChat">گفتگو با ارائه‌دهنده</UButton>

      <section v-if="booking.canReview" class="mt-10 border-t border-ink-200 pt-8">
        <h2 class="text-lg font-medium">نظر شما</h2>
        <p class="mt-2 text-sm leading-7 text-ink-600">امتیاز واقعی پس از اتمام خدمت. هر بُعد از ۱ تا ۵.</p>
        <div class="mt-5 space-y-4">
          <div v-for="dim in REVIEW_DIMENSIONS" :key="dim">
            <p class="text-sm">{{ REVIEW_DIMENSION_LABELS[dim] }}</p>
            <div class="mt-1 flex gap-2">
              <button
                v-for="n in 5"
                :key="n"
                type="button"
                class="h-8 w-8 text-sm"
                :class="reviewForm[dim] >= n ? 'text-terracotta-600' : 'text-ink-300'"
                @click="setScore(dim, n)"
              >
                {{ n }}
              </button>
            </div>
          </div>
          <UTextarea v-model="reviewForm.comment" class="w-full" placeholder="تجربه‌تان را بنویسید" />
          <p v-if="reviewError" class="text-sm text-terracotta-700">{{ reviewError }}</p>
          <UButton :loading="reviewPending" @click="submitReview">ثبت نظر</UButton>
        </div>
      </section>
      <section v-else-if="booking.review" class="mt-10 border-t border-ink-200 pt-8">
        <h2 class="text-lg font-medium">نظر ثبت‌شده</h2>
        <p class="mt-2 text-sm">کل تجربه: {{ booking.review.overall }} از ۵</p>
        <p class="mt-2 text-sm leading-7 text-ink-700">{{ booking.review.comment }}</p>
      </section>

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
