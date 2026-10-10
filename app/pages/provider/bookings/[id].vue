<script setup lang="ts">
import type { Booking } from '~~/shared/types/booking'
import { BOOKING_STATUS_LABELS } from '~~/shared/constants/bookings'
import { PAYMENT_STATUS_LABELS } from '~~/shared/constants/payments'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const route = useRoute()
const toast = useToast()
const id = computed(() => String(route.params.id))
const booking = ref<Booking | null>(null)
const loading = ref(true)
const pending = ref(false)
const error = ref('')
const reason = ref('')
const note = ref('')

type ReasonAction = 'reject' | 'cancel' | 'dispute'
const reasonModal = ref<ReasonAction | null>(null)
const acceptOpen = ref(false)

const REASON_COPY: Record<ReasonAction, { title: string, description: string, cta: string, success: string, color: 'error' | 'primary' | 'neutral' }> = {
  reject: { title: 'رد درخواست', description: 'دلیل رد به صاحب حیوان نمایش داده می‌شود.', cta: 'رد درخواست', success: 'درخواست رد شد', color: 'error' },
  cancel: { title: 'لغو رزرو', description: 'لغو پس از پذیرش روی اعتبار شما اثر می‌گذارد. دلیل را بنویسید.', cta: 'لغو رزرو', success: 'رزرو لغو شد', color: 'error' },
  dispute: { title: 'ثبت اختلاف', description: 'موضوع را توضیح دهید؛ تیم پشتیبانی بررسی می‌کند.', cta: 'ثبت اختلاف', success: 'اختلاف ثبت شد', color: 'primary' },
}

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

async function act(action: string, body?: Record<string, string>, successTitle?: string) {
  if (!booking.value) return
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { booking: Booking } }>(`/api/provider/bookings/${booking.value.id}/${action}`, {
      method: 'POST',
      body,
    })
    booking.value = res.data.booking
    reasonModal.value = null
    acceptOpen.value = false
    reason.value = ''
    note.value = ''
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
  if (!reasonModal.value) return
  const a = reasonModal.value
  act(a, { reason: reason.value }, REASON_COPY[a].success)
}

function money(b: Booking) {
  if (b.negotiable || b.totalAmount == null) return 'توافقی'
  return formatToman(b.totalAmount)
}

const paid = computed(() => booking.value?.payment?.status === 'PAID' || booking.value?.payment?.status === 'PARTIALLY_REFUNDED')
const canCancel = computed(() => Boolean(booking.value && ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.value.status)))
const canDispute = computed(() => Boolean(booking.value && ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.value.status)))

/** Primary next step for the current status. */
const primary = computed(() => {
  switch (booking.value?.status) {
    case 'ACCEPTED': return { label: 'تأیید نهایی', action: 'confirm', icon: 'i-lucide-check-check', success: 'رزرو تأیید شد' }
    case 'CONFIRMED': return { label: 'شروع خدمت', action: 'start', icon: 'i-lucide-play', success: 'خدمت شروع شد' }
    case 'IN_PROGRESS': return { label: 'اتمام خدمت', action: 'complete', icon: 'i-lucide-flag', success: 'خدمت تمام شد' }
    default: return null
  }
})

useHead(() => ({ title: booking.value ? `${booking.value.serviceTitle} | پت‌یار` : 'رزرو | پت‌یار' }))
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <NuxtLink to="/provider/bookings" class="-ms-1 mb-3 inline-flex min-h-touch items-center gap-1.5 rounded-md px-1 text-sm font-medium text-muted hover:text-highlighted">
      <UIcon name="i-lucide-arrow-right" class="size-4" aria-hidden="true" />
      درخواست‌ها
    </NuxtLink>

    <SkeletonList v-if="loading" :rows="3" />
    <AppState v-else-if="!booking" variant="error" :title="error || 'رزرو یافت نشد'" retry @retry="load" />

    <template v-else>
      <AppSection>
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-semibold text-primary">رزرو</p>
            <h1 class="mt-0.5 text-2xl">{{ booking.serviceTitle }}</h1>
            <p class="mt-1 text-sm text-muted">حیوان: {{ booking.petName }}</p>
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

        <!-- Payment status -->
        <div class="mt-4 rounded-lg bg-canvas-deep p-3 text-sm">
          <template v-if="paid && booking.payment">
            <p class="flex items-center gap-1.5 font-medium text-forest-800 dark:text-forest-200">
              <UIcon name="i-lucide-badge-check" class="size-4" aria-hidden="true" />
              پرداخت تأیید شده
            </p>
            <p class="mt-1 text-toned">سهم شما پس از کارمزد: <span class="font-bold text-highlighted">{{ formatToman(booking.payment.providerPayout) }}</span></p>
          </template>
          <p v-else-if="booking.payment" class="flex items-center gap-2 text-toned">
            وضعیت پرداخت:
            <StatusBadge :label="PAYMENT_STATUS_LABELS[booking.payment.status]" :meta="PAYMENT_STATUS_META[booking.payment.status]" size="sm" />
          </p>
          <p v-else class="flex items-start gap-1.5 text-toned">
            <UIcon name="i-lucide-info" class="mt-1 size-4 shrink-0" aria-hidden="true" />
            <span>تا پرداخت تأیید نشود، خدمت را شروع نکنید.<template v-if="booking.negotiable"> این رزرو توافقی است و پرداخت آنلاین ندارد.</template></span>
          </p>
        </div>

        <!-- Actions -->
        <div class="mt-5 flex flex-wrap gap-2 border-t border-muted pt-4">
          <template v-if="booking.status === 'PENDING'">
            <UButton icon="i-lucide-check" class="flex-1 sm:flex-none" @click="acceptOpen = true">پذیرش</UButton>
            <UButton color="neutral" variant="outline" icon="i-lucide-x" class="flex-1 sm:flex-none" @click="reasonModal = 'reject'">رد</UButton>
          </template>
          <UButton v-else-if="primary" :icon="primary.icon" :loading="pending" class="flex-1 sm:flex-none" @click="act(primary.action, undefined, primary.success)">
            {{ primary.label }}
          </UButton>
          <UButton color="neutral" variant="outline" icon="i-lucide-message-circle" class="flex-1 sm:flex-none" aria-label="گفتگو با صاحب حیوان" @click="openChat">گفتگو</UButton>
        </div>
        <InlineMessage :message="error" class="mt-3" />
      </AppSection>

      <AppSection v-if="booking.ownerNote || booking.providerNote || booking.cancellationReason" title="یادداشت‌ها" class="mt-6">
        <dl class="space-y-3 text-sm leading-7">
          <div v-if="booking.ownerNote">
            <dt class="text-xs font-semibold text-muted">یادداشت صاحب حیوان</dt>
            <dd class="text-default">{{ booking.ownerNote }}</dd>
          </div>
          <div v-if="booking.providerNote">
            <dt class="text-xs font-semibold text-muted">پیام شما</dt>
            <dd class="text-default">{{ booking.providerNote }}</dd>
          </div>
          <div v-if="booking.cancellationReason">
            <dt class="text-xs font-semibold text-muted">دلیل لغو</dt>
            <dd class="text-default">{{ booking.cancellationReason }}</dd>
          </div>
        </dl>
      </AppSection>

      <div v-if="canCancel || canDispute" class="mt-8 flex flex-wrap gap-2 border-t border-muted pt-5">
        <UButton v-if="canCancel" color="neutral" variant="outline" icon="i-lucide-calendar-x" size="md" @click="reasonModal = 'cancel'">لغو رزرو</UButton>
        <UButton v-if="canDispute" color="neutral" variant="ghost" icon="i-lucide-shield-alert" size="md" @click="reasonModal = 'dispute'">ثبت اختلاف</UButton>
      </div>

      <!-- Accept modal -->
      <UModal v-model:open="acceptOpen" title="پذیرش درخواست" description="می‌توانید پیامی برای صاحب حیوان بنویسید (اختیاری).">
        <template #body>
          <UFormField label="پیام برای صاحب" name="note">
            <UTextarea v-model="note" class="w-full" :rows="3" placeholder="مثلاً: لطفاً کارت واکسن را همراه بیاورید." />
          </UFormField>
          <InlineMessage :message="error" class="mt-3" />
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton color="neutral" variant="ghost" size="md" @click="acceptOpen = false">انصراف</UButton>
            <UButton size="md" icon="i-lucide-check" :loading="pending" @click="act('accept', { note }, 'درخواست پذیرفته شد')">پذیرش</UButton>
          </div>
        </template>
      </UModal>

      <!-- Reason modal -->
      <UModal
        :open="Boolean(reasonModal)"
        :title="reasonModal ? REASON_COPY[reasonModal].title : ''"
        :description="reasonModal ? REASON_COPY[reasonModal].description : ''"
        @update:open="(v: boolean) => { if (!v) reasonModal = null }"
      >
        <template #body>
          <UFormField label="دلیل" name="reason" :required="reasonModal !== 'reject'" :help="reasonModal === 'reject' ? 'اختیاری' : 'حداقل ۳ کاراکتر'">
            <UTextarea v-model="reason" class="w-full" :rows="3" autofocus />
          </UFormField>
          <InlineMessage :message="error" class="mt-3" />
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton color="neutral" variant="ghost" size="md" @click="reasonModal = null">انصراف</UButton>
            <UButton
              v-if="reasonModal"
              :color="REASON_COPY[reasonModal].color"
              size="md"
              :loading="pending"
              :disabled="reasonModal !== 'reject' && reason.trim().length < 3"
              @click="submitReason"
            >
              {{ REASON_COPY[reasonModal].cta }}
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
