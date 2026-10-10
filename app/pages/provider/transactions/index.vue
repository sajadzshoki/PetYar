<script setup lang="ts">
import type { Payment, ProviderEarnings } from '~~/shared/types/payment'
import { PAYMENT_STATUS_LABELS } from '~~/shared/constants/payments'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const payments = ref<Payment[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  try {
    const res = await $fetch<{ data: { earnings: ProviderEarnings, payments: Payment[] } }>('/api/provider/earnings')
    payments.value = res.data.payments
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری تراکنش‌ها ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

function toman(n: number) {
  return `${new Intl.NumberFormat('fa-IR').format(n)} تومان`
}

function when(iso: string) {
  return new Date(iso).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-10">
    <h1 class="text-2xl font-semibold">تراکنش‌ها</h1>
    <p class="mt-2 text-sm leading-7 text-ink-600">همان ردیف‌های پرداخت؛ دفترکل در جزئیات هر مورد.</p>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <p v-else-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
    <div v-else class="mt-6 overflow-x-auto">
      <table v-if="payments.length" class="w-full min-w-80 text-right text-sm">
        <thead class="text-ink-500">
          <tr>
            <th class="py-2 font-normal">وضعیت</th>
            <th class="py-2 font-normal">ناخالص</th>
            <th class="py-2 font-normal">کارمزد</th>
            <th class="py-2 font-normal">سهم شما</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in payments" :key="p.id" class="border-t border-ink-100">
            <td class="py-3">
              <NuxtLink :to="`/provider/transactions/${p.id}`">{{ PAYMENT_STATUS_LABELS[p.status] }}</NuxtLink>
              <p class="text-xs text-ink-400">{{ when(p.createdAt) }}</p>
            </td>
            <td class="py-3">{{ toman(p.amount) }}</td>
            <td class="py-3">{{ toman(p.platformFee) }}</td>
            <td class="py-3">{{ toman(p.providerPayout) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="text-sm text-ink-500">تراکنشی نیست.</p>
    </div>
  </div>
</template>
