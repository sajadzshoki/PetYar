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
  error.value = ''
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

useHead({ title: 'تراکنش‌ها | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="تراکنش‌ها" description="همه ردیف‌های پرداخت؛ دفترکل هر مورد در جزئیات." />

    <SkeletonList v-if="loading" :rows="4" />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />
    <AppState v-else-if="!payments.length" icon="i-lucide-receipt" title="تراکنشی نیست" description="پس از اولین پرداخت مشتری، ردیف‌ها اینجا نمایش داده می‌شوند." />

    <template v-else>
      <!-- Mobile: cards -->
      <ul class="grid gap-3 md:hidden">
        <li v-for="p in payments" :key="p.id">
          <NuxtLink :to="`/provider/transactions/${p.id}`" class="pressable surface block p-4">
            <div class="flex items-center justify-between gap-3">
              <StatusBadge :label="PAYMENT_STATUS_LABELS[p.status]" :meta="PAYMENT_STATUS_META[p.status]" size="sm" />
              <span class="text-xs text-dimmed">{{ formatDateTime(p.createdAt) }}</span>
            </div>
            <dl class="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt class="text-muted">ناخالص</dt>
                <dd class="mt-0.5 font-semibold text-highlighted">{{ formatToman(p.amount) }}</dd>
              </div>
              <div>
                <dt class="text-muted">کارمزد</dt>
                <dd class="mt-0.5 font-semibold text-highlighted">{{ formatToman(p.platformFee) }}</dd>
              </div>
              <div>
                <dt class="text-muted">سهم شما</dt>
                <dd class="mt-0.5 font-bold text-primary">{{ formatToman(p.providerPayout) }}</dd>
              </div>
            </dl>
          </NuxtLink>
        </li>
      </ul>

      <!-- Desktop: table -->
      <div class="surface hidden overflow-x-auto md:block">
        <table class="w-full text-start text-sm">
          <thead class="bg-canvas text-xs text-muted">
            <tr>
              <th scope="col" class="px-4 py-3 text-start font-semibold">وضعیت</th>
              <th scope="col" class="px-4 py-3 text-start font-semibold">تاریخ</th>
              <th scope="col" class="px-4 py-3 text-start font-semibold">ناخالص</th>
              <th scope="col" class="px-4 py-3 text-start font-semibold">کارمزد</th>
              <th scope="col" class="px-4 py-3 text-start font-semibold">سهم شما</th>
              <th scope="col" class="px-4 py-3"><span class="sr-only">جزئیات</span></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-muted">
            <tr v-for="p in payments" :key="p.id" class="hover:bg-canvas">
              <td class="px-4 py-3"><StatusBadge :label="PAYMENT_STATUS_LABELS[p.status]" :meta="PAYMENT_STATUS_META[p.status]" size="sm" /></td>
              <td class="px-4 py-3 text-muted">{{ formatDateTime(p.createdAt) }}</td>
              <td class="px-4 py-3 text-highlighted">{{ formatToman(p.amount) }}</td>
              <td class="px-4 py-3 text-highlighted">{{ formatToman(p.platformFee) }}</td>
              <td class="px-4 py-3 font-semibold text-highlighted">{{ formatToman(p.providerPayout) }}</td>
              <td class="px-4 py-3 text-end">
                <UButton :to="`/provider/transactions/${p.id}`" size="xs" color="neutral" variant="ghost" trailing-icon="i-lucide-chevron-left">جزئیات</UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
