<script setup lang="ts">
import type { Booking } from '~~/shared/types/booking'
import type { Payment } from '~~/shared/types/payment'
import type { Review } from '~~/shared/types/review'
import { BOOKING_STATUS_LABELS } from '~~/shared/constants/bookings'
import { PAYMENT_STATUS_LABELS } from '~~/shared/constants/payments'
import { REVIEW_DIMENSION_LABELS, REVIEW_DIMENSIONS } from '~~/shared/constants/reviews'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const toast = useToast()
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
const reasonModal = ref<null | 'cancel' | 'dispute'>(null)

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

async function act(path: string, body?: Record<string, string>, successTitle?: string) {
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { booking: Booking } }>(path, { method: 'POST', body })
    booking.value = res.data.booking
    reasonModal.value = null
    reason.value = ''
    if (successTitle) toast.add({ title: successTitle, icon: 'i-lucide-check', color: 'success' })
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'انجام نشد')
  }
  finally {
    pending.value = false
  }
}

function submitReason() {
  if (!booking.value || !reasonModal.value) return
  const path = reasonModal.value === 'cancel'
    ? `/api/bookings/${booking.value.id}/cancel`
    : `/api/bookings/${booking.value.id}/dispute`
  act(path, { reason: reason.value }, reasonModal.value === 'cancel' ? 'رزرو لغو شد' : 'اختلاف ثبت شد')
}

function money(b: Booking) {
  if (b.negotiable || b.totalAmount == null) return 'توافقی'
  return formatToman(b.totalAmount)
}

const canPay = computed(() => {
  const b = booking.value
  if (!b || b.negotiable || b.totalAmount == null) return false
  if (!['ACCEPTED', 'CONFIRMED'].includes(b.status)) return false
  const st = b.payment?.status
  return !st || st === 'PENDING' || st === 'FAILED' || st === 'PROCESSING'
})

const canCancel = computed(() => Boolean(booking.value && ['PENDING', 'ACCEPTED', 'CONFIRMED'].includes(booking.value.status)))
const canDispute = computed(() => Boolean(booking.value && ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.value.status)))

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
    toast.add({ title: 'نظر شما ثبت شد', icon: 'i-lucide-star', color: 'success' })
  }
  catch (err) {
    reviewError.value = apiErrorMessage(err, 'ثبت نظر ناموفق بود')
  }
  finally {
    reviewPending.value = false
  }
}

/** Status timeline: which milestones are reached for the current status. */
const STEPS = [
  { key: 'PENDING', label: 'درخواست ثبت شد' },
  { key: 'ACCEPTED', label: 'ارائه‌دهنده پذیرفت' },
  { key: 'CONFIRMED', label: 'تأیید نهایی' },
  { key: 'IN_PROGRESS', label: 'در حال انجام' },
  { key: 'COMPLETED', label: 'تمام شد' },
] as const
const stepIndex = computed(() => {
  const s = booking.value?.status
  const idx = STEPS.findIndex(st => st.key === s)
  return idx
})
const terminalNegative = computed(() => Boolean(booking.value && ['CANCELLED', 'REJECTED', 'DISPUTED'].includes(booking.value.status)))

useHead(() => ({ title: booking.value ? `${booking.value.serviceTitle} | پت‌یار` : 'رزرو | پت‌یار' }))
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <NuxtLink to="/bookings" class="-ms-1 mb-3 inline-flex min-h-touch items-center gap-1.5 rounded-md px-1 text-sm font-medium text-muted hover:text-highlighted">
      <UIcon name="i-lucide-arrow-right" class="size-4" aria-hidden="true" />
      رزروهای من
    </NuxtLink>

    <SkeletonList v-if="loading" :rows="3" />
    <AppState v-else-if="!booking" variant="error" :title="error || 'رزرو یافت نشد'" retry @retry="load" />

    <template v-else>
      <AppSection>
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-semibold text-primary">{{ booking.providerName }}</p>
            <h1 class="mt-0.5 text-2xl">{{ booking.serviceTitle }}</h1>
            <p class="mt-1 text-sm text-muted">برای {{ booking.petName }}</p>
          </div>
          <StatusBadge :label="BOOKING_STATUS_LABELS[booking.status]" :meta="BOOKING_STATUS_META[booking.status]" class="shrink-0" />
        </div>

        <dl class="mt-5 grid gap-3 border-t border-muted pt-4 text-sm sm:grid-cols-3">
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-calendar" class="mt-1 size-4 shrink-0 text-muted" aria-hidden="true" />
            <div>
              <dt class="text-xs text-muted">تاریخ</dt>
              <dd class="font-medium text-highlighted">{{ formatDayShort(booking.startAt) }}</dd>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-clock" class="mt-1 size-4 shrink-0 text-muted" aria-hidden="true" />
            <div>
              <dt class="text-xs text-muted">ساعت (تهران)</dt>
              <dd class="font-medium text-highlighted"><span class="num">{{ formatTime(booking.startAt) }}</span> تا <span class="num">{{ formatTime(booking.endAt) }}</span></dd>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-wallet" class="mt-1 size-4 shrink-0 text-muted" aria-hidden="true" />
            <div>
              <dt class="text-xs text-muted">مبلغ</dt>
              <dd class="font-bold text-highlighted">{{ money(booking) }}</dd>
            </div>
          </div>
        </dl>

        <!-- Timeline -->
        <ol v-if="!terminalNegative" class="mt-5 flex items-center gap-1" aria-label="مراحل رزرو">
          <li v-for="(step, i) in STEPS" :key="step.key" class="flex flex-1 flex-col items-center gap-1.5 text-center">
            <span
              class="block h-1.5 w-full rounded-full"
              :class="i <= stepIndex ? 'bg-primary' : 'bg-ink-200'"
              aria-hidden="true"
            />
            <span class="text-[11px] leading-4" :class="i <= stepIndex ? 'font-semibold text-highlighted' : 'text-dimmed'">
              {{ step.label }}
              <span v-if="i === stepIndex" class="sr-only">(مرحله فعلی)</span>
            </span>
          </li>
        </ol>

        <div class="mt-5 flex flex-wrap gap-2 border-t border-muted pt-4">
          <UButton v-if="canPay" icon="i-lucide-credit-card" :loading="payPending" class="flex-1 sm:flex-none" @click="startPay">پرداخت</UButton>
          <UButton
            v-if="booking.status === 'ACCEPTED'"
            icon="i-lucide-check-check"
            :variant="canPay ? 'soft' : 'solid'"
            :loading="pending"
            class="flex-1 sm:flex-none"
            @click="act(`/api/bookings/${booking.id}/confirm`, undefined, 'رزرو تأیید شد')"
          >
            تأیید نهایی
          </UButton>
          <UButton color="neutral" variant="outline" icon="i-lucide-message-circle" class="flex-1 sm:flex-none" @click="openChat">گفتگو</UButton>
        </div>
        <InlineMessage :message="gatewayReason" kind="warning" class="mt-3" />
        <InlineMessage :message="payError" class="mt-3" />
        <InlineMessage :message="error" class="mt-3" />
      </AppSection>

      <AppSection v-if="booking.payment" title="پرداخت" class="mt-6">
        <div class="flex items-center justify-between gap-3">
          <StatusBadge :label="PAYMENT_STATUS_LABELS[booking.payment.status]" :meta="PAYMENT_STATUS_META[booking.payment.status]" />
          <UButton :to="`/payments/${booking.payment.id}`" color="neutral" variant="ghost" size="md" trailing-icon="i-lucide-chevron-left">جزئیات پرداخت</UButton>
        </div>
      </AppSection>

      <AppSection v-if="booking.ownerNote || booking.providerNote || booking.cancellationReason" title="یادداشت‌ها" class="mt-6">
        <dl class="space-y-3 text-sm leading-7">
          <div v-if="booking.ownerNote">
            <dt class="text-xs font-semibold text-muted">یادداشت شما</dt>
            <dd class="text-default">{{ booking.ownerNote }}</dd>
          </div>
          <div v-if="booking.providerNote">
            <dt class="text-xs font-semibold text-muted">پیام ارائه‌دهنده</dt>
            <dd class="text-default">{{ booking.providerNote }}</dd>
          </div>
          <div v-if="booking.cancellationReason">
            <dt class="text-xs font-semibold text-muted">دلیل لغو</dt>
            <dd class="text-default">{{ booking.cancellationReason }}</dd>
          </div>
        </dl>
      </AppSection>

      <!-- Review -->
      <AppSection v-if="booking.canReview" title="نظر شما" description="پس از اتمام خدمت، به هر بُعد از ۱ تا ۵ امتیاز بدهید." class="mt-6">
        <form class="space-y-4" @submit.prevent="submitReview">
          <ScoreInput
            v-for="dim in REVIEW_DIMENSIONS"
            :key="dim"
            v-model="reviewForm[dim]"
            :label="REVIEW_DIMENSION_LABELS[dim]"
          />
          <UFormField label="توضیح" name="comment">
            <UTextarea v-model="reviewForm.comment" class="w-full" :rows="3" placeholder="تجربه‌تان را بنویسید" />
          </UFormField>
          <InlineMessage :message="reviewError" />
          <UButton type="submit" :loading="reviewPending" icon="i-lucide-star">ثبت نظر</UButton>
        </form>
      </AppSection>
      <AppSection v-else-if="booking.review" title="نظر ثبت‌شده" class="mt-6">
        <p class="inline-flex items-center gap-1.5 text-sm font-semibold">
          <UIcon name="i-lucide-star" class="size-4 fill-terracotta-400 text-terracotta-400 dark:fill-terracotta-300 dark:text-terracotta-300" aria-hidden="true" />
          <span class="num">{{ formatRating(booking.review.overall) }}</span>
          <span class="font-normal text-muted">از ۵</span>
        </p>
        <p class="mt-2 text-sm leading-7 text-default">{{ booking.review.comment }}</p>
      </AppSection>

      <!-- Secondary actions -->
      <div v-if="canCancel || canDispute" class="mt-8 flex flex-wrap gap-2 border-t border-muted pt-5">
        <UButton v-if="canCancel" color="neutral" variant="outline" icon="i-lucide-calendar-x" size="md" @click="reasonModal = 'cancel'">لغو رزرو</UButton>
        <UButton v-if="canDispute" color="neutral" variant="ghost" icon="i-lucide-shield-alert" size="md" @click="reasonModal = 'dispute'">ثبت اختلاف</UButton>
      </div>

      <UModal
        :open="Boolean(reasonModal)"
        :title="reasonModal === 'cancel' ? 'لغو رزرو' : 'ثبت اختلاف'"
        :description="reasonModal === 'cancel' ? 'دلیل لغو را بنویسید تا به ارائه‌دهنده اطلاع داده شود.' : 'موضوع را توضیح دهید؛ تیم پشتیبانی بررسی می‌کند.'"
        @update:open="(v: boolean) => { if (!v) reasonModal = null }"
      >
        <template #body>
          <UFormField label="دلیل" name="reason" required help="حداقل ۳ کاراکتر">
            <UTextarea v-model="reason" class="w-full" :rows="3" autofocus />
          </UFormField>
          <InlineMessage :message="error" class="mt-3" />
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton color="neutral" variant="ghost" size="md" @click="reasonModal = null">انصراف</UButton>
            <UButton
              :color="reasonModal === 'cancel' ? 'error' : 'primary'"
              size="md"
              :loading="pending"
              :disabled="reason.trim().length < 3"
              @click="submitReason"
            >
              {{ reasonModal === 'cancel' ? 'لغو رزرو' : 'ثبت اختلاف' }}
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
