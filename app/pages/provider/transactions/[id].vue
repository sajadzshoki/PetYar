<script setup lang="ts">
import type { PaymentWithTransactions } from '~~/shared/types/payment'
import { PAYMENT_STATUS_LABELS, PAYMENT_TRANSACTION_LABELS } from '~~/shared/constants/payments'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const payment = ref<PaymentWithTransactions | null>(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { payment: PaymentWithTransactions } }>(`/api/payments/${id.value}`)
    payment.value = res.data.payment
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'تراکنش یافت نشد')
    payment.value = null
  }
  finally {
    loading.value = false
  }
}

watch(id, load, { immediate: true })

useHead({ title: 'جزئیات تراکنش | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-narrow px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="جزئیات تراکنش" compact :back="{ to: '/provider/transactions', label: 'تراکنش‌ها' }" />

    <SkeletonList v-if="loading" :rows="2" />
    <AppState v-else-if="!payment" variant="error" :title="error || 'یافت نشد'" retry @retry="load" />

    <template v-else>
      <AppSection>
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm text-muted">سهم شما</p>
            <p class="mt-1 text-3xl font-extrabold text-highlighted">{{ formatToman(payment.providerPayout) }}</p>
          </div>
          <StatusBadge :label="PAYMENT_STATUS_LABELS[payment.status]" :meta="PAYMENT_STATUS_META[payment.status]" class="shrink-0" />
        </div>
        <dl class="mt-5 space-y-2 border-t border-muted pt-4 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-muted">مبلغ ناخالص</dt>
            <dd class="font-medium text-highlighted">{{ formatToman(payment.amount) }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-muted">کارمزد پلتفرم</dt>
            <dd class="font-medium text-highlighted">{{ formatToman(payment.platformFee) }}</dd>
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
        <UButton v-if="payment.bookingId" :to="`/provider/bookings/${payment.bookingId}`" class="mt-4" color="neutral" variant="outline" size="md" icon="i-lucide-calendar">رزرو مرتبط</UButton>
      </AppSection>

      <AppSection title="دفترکل" class="mt-6" flush>
        <p v-if="!payment.transactions.length" class="px-4 pb-4 text-sm text-muted sm:px-5">دفترکل هنوز ردیفی ندارد (پرداخت تأیید نشده).</p>
        <ul v-else class="divide-y divide-muted border-t border-muted text-sm">
          <li v-for="tx in payment.transactions" :key="tx.id" class="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div class="min-w-0">
              <p class="font-medium text-highlighted">{{ PAYMENT_TRANSACTION_LABELS[tx.type] }}</p>
              <p class="mt-0.5 text-xs text-dimmed">{{ formatDateTime(tx.createdAt) }}</p>
            </div>
            <span class="shrink-0 font-semibold text-highlighted">{{ formatToman(tx.amount) }}</span>
          </li>
        </ul>
      </AppSection>
    </template>
  </div>
</template>
