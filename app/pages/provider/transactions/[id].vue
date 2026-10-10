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

function toman(n: number) {
  return `${new Intl.NumberFormat('fa-IR').format(n)} تومان`
}
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-10">
    <NuxtLink to="/provider/transactions" class="text-sm text-ink-600">تراکنش‌ها</NuxtLink>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <AppState v-else-if="!payment" :title="error || 'یافت نشد'" />
    <template v-else>
      <h1 class="mt-3 text-2xl font-semibold">{{ PAYMENT_STATUS_LABELS[payment.status] }}</h1>
      <p class="mt-2 text-sm">ناخالص {{ toman(payment.amount) }} · کارمزد {{ toman(payment.platformFee) }} · سهم {{ toman(payment.providerPayout) }}</p>
      <p v-if="payment.bookingId" class="mt-2 text-sm">
        <NuxtLink :to="`/provider/bookings/${payment.bookingId}`" class="text-terracotta-700">رزرو مرتبط</NuxtLink>
      </p>
      <ul class="mt-8 divide-y divide-ink-100 text-sm">
        <li v-for="tx in payment.transactions" :key="tx.id" class="flex justify-between py-2">
          <span>{{ PAYMENT_TRANSACTION_LABELS[tx.type] }}</span>
          <span>{{ toman(tx.amount) }}</span>
        </li>
      </ul>
      <p v-if="!payment.transactions.length" class="mt-6 text-sm text-ink-500">دفترکل هنوز ردیفی ندارد (پرداخت تأیید نشده).</p>
    </template>
  </div>
</template>
