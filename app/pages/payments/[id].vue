<script setup lang="ts">
import type { PaymentWithTransactions } from '~~/shared/types/payment'
import { PAYMENT_STATUS_LABELS, PAYMENT_TRANSACTION_LABELS } from '~~/shared/constants/payments'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const payment = ref<PaymentWithTransactions | null>(null)
const loading = ref(true)
const pending = ref(false)
const error = ref('')
const reason = ref('')

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

function toman(n: number) {
  return `${new Intl.NumberFormat('fa-IR').format(n)} تومان`
}

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
    await load()
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بازپرداخت انجام نشد')
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl px-4 py-12">
    <NuxtLink v-if="payment" :to="`/bookings/${payment.bookingId}`" class="text-sm text-ink-600">رزرو</NuxtLink>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <AppState v-else-if="!payment" :title="error || 'پرداخت یافت نشد'" />
    <template v-else>
      <h1 class="mt-3 text-2xl font-semibold">پرداخت</h1>
      <p class="mt-3 text-sm font-medium">{{ PAYMENT_STATUS_LABELS[payment.status] }}</p>
      <p class="mt-2 text-sm leading-7">مبلغ: {{ toman(payment.amount) }}</p>
      <p class="text-sm text-ink-600">کارمزد پلتفرم: {{ toman(payment.platformFee) }}</p>
      <p class="text-sm text-ink-600">سهم ارائه‌دهنده: {{ toman(payment.providerPayout) }}</p>
      <p v-if="payment.refundedAmount" class="text-sm">بازپرداخت‌شده: {{ toman(payment.refundedAmount) }}</p>
      <p v-if="!payment.configured" class="mt-4 text-sm leading-7 text-terracotta-700">
        {{ payment.errorMessage || 'درگاه پرداخت پیکربندی نشده است. پرداخت موفق جعلی ثبت نمی‌شود.' }}
      </p>
      <p v-else-if="payment.status === 'FAILED'" class="mt-4 text-sm text-terracotta-700">
        {{ payment.errorMessage || 'پرداخت ناموفق بود.' }}
        <NuxtLink :to="`/bookings/${payment.bookingId}`" class="mr-2 underline">تلاش دوباره از صفحه رزرو</NuxtLink>
      </p>
      <p v-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>

      <ul v-if="payment.transactions.length" class="mt-8 divide-y divide-ink-100 text-sm">
        <li v-for="tx in payment.transactions" :key="tx.id" class="flex justify-between py-2">
          <span>{{ PAYMENT_TRANSACTION_LABELS[tx.type] }}</span>
          <span>{{ toman(tx.amount) }}</span>
        </li>
      </ul>

      <div v-if="payment.status === 'PAID' || payment.status === 'PARTIALLY_REFUNDED'" class="mt-8 space-y-3">
        <UInput v-model="reason" class="w-full" placeholder="دلیل بازپرداخت" />
        <UButton color="neutral" variant="outline" :loading="pending" :disabled="reason.trim().length < 3" @click="refund">
          درخواست بازپرداخت
        </UButton>
      </div>
    </template>
  </div>
</template>
