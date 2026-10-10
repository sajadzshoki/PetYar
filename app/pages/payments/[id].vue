<script setup lang="ts">
import type { PaymentWithTransactions } from '~~/shared/types/payment'
import { PAYMENT_STATUS_LABELS, PAYMENT_TRANSACTION_LABELS } from '~~/shared/constants/payments'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const toast = useToast()
const id = computed(() => String(route.params.id))
const payment = ref<PaymentWithTransactions | null>(null)
const loading = ref(true)
const pending = ref(false)
const error = ref('')
const reason = ref('')
const refundOpen = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { payment: PaymentWithTransactions } }>(`/api/payments/${id.value}`)
    payment.value = res.data.payment
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'پرداخت یافت نشد')
    payment.value = null
  }
  finally {
    loading.value = false
  }
}

watch(id, load, { immediate: true })

async function refund() {
  if (!payment.value) return
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { payment: PaymentWithTransactions } }>(`/api/payments/${payment.value.id}/refund`, {
      method: 'POST',
      body: { reason: reason.value },
    })
    payment.value = { ...res.data.payment, transactions: payment.value.transactions }
    refundOpen.value = false
    reason.value = ''
    toast.add({ title: 'درخواست بازپرداخت ثبت شد', icon: 'i-lucide-check', color: 'success' })
    await load()
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بازپرداخت انجام نشد')
  }
  finally {
    pending.value = false
  }
}

const canRefund = computed(() => payment.value?.status === 'PAID' || payment.value?.status === 'PARTIALLY_REFUNDED')

useHead({ title: 'پرداخت | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-narrow px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader
      title="پرداخت"
      :back="payment ? { to: `/bookings/${payment.bookingId}`, label: 'بازگشت به رزرو' } : { to: '/bookings', label: 'رزروهای من' }"
    />

    <SkeletonList v-if="loading" :rows="2" />
    <AppState v-else-if="!payment" variant="error" :title="error || 'پرداخت یافت نشد'" retry @retry="load" />

    <template v-else>
      <AppSection>
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm text-muted">مبلغ کل</p>
            <p class="mt-1 text-3xl font-extrabold text-highlighted">{{ formatToman(payment.amount) }}</p>
          </div>
          <StatusBadge :label="PAYMENT_STATUS_LABELS[payment.status]" :meta="PAYMENT_STATUS_META[payment.status]" class="shrink-0" />
        </div>

        <dl class="mt-5 space-y-2 border-t border-muted pt-4 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-muted">کارمزد پلتفرم</dt>
            <dd class="font-medium text-highlighted">{{ formatToman(payment.platformFee) }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-muted">سهم ارائه‌دهنده</dt>
            <dd class="font-medium text-highlighted">{{ formatToman(payment.providerPayout) }}</dd>
          </div>
          <div v-if="payment.refundedAmount" class="flex justify-between gap-3">
            <dt class="text-muted">بازپرداخت‌شده</dt>
            <dd class="font-medium text-highlighted">{{ formatToman(payment.refundedAmount) }}</dd>
          </div>
          <div v-if="payment.paidAt" class="flex justify-between gap-3">
            <dt class="text-muted">زمان پرداخت</dt>
            <dd class="text-highlighted">{{ formatDateTime(payment.paidAt) }}</dd>
          </div>
          <div v-if="payment.reference" class="flex justify-between gap-3">
            <dt class="text-muted">کد پیگیری</dt>
            <dd class="ltr font-mono text-xs text-highlighted">{{ payment.reference }}</dd>
          </div>
        </dl>

        <UAlert
          v-if="!payment.configured"
          class="mt-4"
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="درگاه پرداخت پیکربندی نشده است"
          :description="payment.errorMessage || 'پرداخت موفق جعلی ثبت نمی‌شود. پس از فعال‌شدن درگاه می‌توانید از صفحه رزرو دوباره تلاش کنید.'"
        />
        <UAlert
          v-else-if="payment.status === 'FAILED'"
          class="mt-4"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-x"
          title="پرداخت ناموفق بود"
          :description="payment.errorMessage || undefined"
          :actions="[{ label: 'تلاش دوباره از صفحه رزرو', to: `/bookings/${payment.bookingId}`, color: 'error', variant: 'solid', size: 'sm' }]"
        />
        <InlineMessage :message="error" class="mt-4" />
      </AppSection>

      <AppSection v-if="payment.transactions.length" title="تراکنش‌ها" class="mt-6" flush>
        <ul class="divide-y divide-muted border-t border-muted text-sm">
          <li v-for="tx in payment.transactions" :key="tx.id" class="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div class="min-w-0">
              <p class="font-medium text-highlighted">{{ PAYMENT_TRANSACTION_LABELS[tx.type] }}</p>
              <p class="mt-0.5 text-xs text-dimmed">{{ formatDateTime(tx.createdAt) }}</p>
            </div>
            <span class="shrink-0 font-semibold text-highlighted">{{ formatToman(tx.amount) }}</span>
          </li>
        </ul>
      </AppSection>

      <div v-if="canRefund" class="mt-8 border-t border-muted pt-5">
        <UButton color="neutral" variant="outline" icon="i-lucide-undo-2" size="md" @click="refundOpen = true">درخواست بازپرداخت</UButton>
      </div>

      <UModal v-model:open="refundOpen" title="درخواست بازپرداخت" description="دلیل بازپرداخت را بنویسید. درخواست پس از بررسی انجام می‌شود.">
        <template #body>
          <UFormField label="دلیل" name="reason" required help="حداقل ۳ کاراکتر">
            <UTextarea v-model="reason" class="w-full" :rows="3" autofocus />
          </UFormField>
          <InlineMessage :message="error" class="mt-3" />
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton color="neutral" variant="ghost" size="md" @click="refundOpen = false">انصراف</UButton>
            <UButton size="md" :loading="pending" :disabled="reason.trim().length < 3" @click="refund">ثبت درخواست</UButton>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
