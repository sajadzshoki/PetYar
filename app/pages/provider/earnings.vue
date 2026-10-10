<script setup lang="ts">
import type { Payment, ProviderEarnings } from '~~/shared/types/payment'
import { PAYMENT_STATUS_LABELS } from '~~/shared/constants/payments'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const earnings = ref<ProviderEarnings | null>(null)
const payments = ref<Payment[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  try {
    const res = await $fetch<{ data: { earnings: ProviderEarnings, payments: Payment[] } }>('/api/provider/earnings')
    earnings.value = res.data.earnings
    payments.value = res.data.payments
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری درآمد ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

function toman(n: number) {
  return `${new Intl.NumberFormat('fa-IR').format(n)} تومان`
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-10">
    <h1 class="text-2xl font-semibold">درآمد</h1>
    <p class="mt-2 text-sm leading-7 text-ink-600">جمع ستون‌های پرداخت ذخیره‌شده. پیش‌بینی یا نمودار ساختگی نیست.</p>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <p v-else-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
    <template v-else-if="earnings">
      <dl class="mt-8 space-y-2 text-sm leading-7">
        <div class="flex justify-between gap-4">
          <dt>مبلغ ناخالص پرداخت‌شده</dt>
          <dd>{{ toman(earnings.grossPaid) }}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt>کارمزد پلتفرم</dt>
          <dd>{{ toman(earnings.platformFees) }}</dd>
        </div>
        <div class="flex justify-between gap-4 font-medium">
          <dt>سهم ارائه‌دهنده</dt>
          <dd>{{ toman(earnings.providerEarnings) }}</dd>
        </div>
        <div class="flex justify-between gap-4 text-ink-600">
          <dt>بازپرداخت‌شده</dt>
          <dd>{{ toman(earnings.refunded) }}</dd>
        </div>
        <div class="flex justify-between gap-4 text-ink-600">
          <dt>در انتظار پرداخت مشتری</dt>
          <dd>{{ toman(earnings.unpaid) }}</dd>
        </div>
      </dl>
      <p class="mt-4 text-xs text-ink-400">{{ earnings.paidCount }} پرداخت تأییدشده · {{ earnings.unpaidCount }} ناتمام</p>
      <ul class="mt-8 divide-y divide-ink-100">
        <li v-for="p in payments" :key="p.id" class="py-3 text-sm">
          <NuxtLink :to="`/provider/transactions/${p.id}`" class="flex justify-between gap-3">
            <span>{{ PAYMENT_STATUS_LABELS[p.status] }}</span>
            <span>{{ toman(p.providerPayout) }}</span>
          </NuxtLink>
        </li>
      </ul>
      <p v-if="!payments.length" class="mt-6 text-sm text-ink-500">پرداختی ثبت نشده.</p>
    </template>
  </div>
</template>
