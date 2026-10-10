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
  error.value = ''
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

useHead({ title: 'درآمد | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="درآمد" description="جمع ستون‌های پرداخت ذخیره‌شده. پیش‌بینی یا نمودار ساختگی نیست." />

    <SkeletonList v-if="loading" :rows="3" />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />

    <template v-else-if="earnings">
      <AppSection>
        <p class="text-sm text-muted">سهم شما (پس از کارمزد)</p>
        <p class="mt-1 text-3xl font-extrabold text-highlighted">{{ formatToman(earnings.providerEarnings) }}</p>
        <p class="mt-1 text-xs text-dimmed">
          <span class="num">{{ formatNumber(earnings.paidCount) }}</span> پرداخت تأییدشده · <span class="num">{{ formatNumber(earnings.unpaidCount) }}</span> ناتمام
        </p>
        <dl class="mt-5 grid grid-cols-2 gap-3 border-t border-muted pt-4 text-sm sm:grid-cols-4">
          <div class="rounded-lg bg-canvas-deep p-3">
            <dt class="text-xs text-muted">مبلغ ناخالص پرداخت‌شده</dt>
            <dd class="mt-1 font-bold text-highlighted">{{ formatToman(earnings.grossPaid) }}</dd>
          </div>
          <div class="rounded-lg bg-canvas-deep p-3">
            <dt class="text-xs text-muted">کارمزد پلتفرم</dt>
            <dd class="mt-1 font-bold text-highlighted">{{ formatToman(earnings.platformFees) }}</dd>
          </div>
          <div class="rounded-lg bg-canvas-deep p-3">
            <dt class="text-xs text-muted">بازپرداخت‌شده</dt>
            <dd class="mt-1 font-bold text-highlighted">{{ formatToman(earnings.refunded) }}</dd>
          </div>
          <div class="rounded-lg bg-canvas-deep p-3">
            <dt class="text-xs text-muted">در انتظار پرداخت مشتری</dt>
            <dd class="mt-1 font-bold text-highlighted">{{ formatToman(earnings.unpaid) }}</dd>
          </div>
        </dl>
      </AppSection>

      <AppSection title="پرداخت‌ها" class="mt-6" flush>
        <p v-if="!payments.length" class="px-4 pb-4 text-sm text-muted sm:px-5">پرداختی ثبت نشده.</p>
        <ul v-else class="divide-y divide-muted border-t border-muted">
          <li v-for="p in payments" :key="p.id">
            <ListRow :to="`/provider/transactions/${p.id}`">
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-semibold text-highlighted">{{ formatToman(p.providerPayout) }}</p>
                  <p class="mt-0.5 text-xs text-dimmed">{{ formatDateTime(p.paidAt || p.createdAt) }}</p>
                </div>
                <StatusBadge :label="PAYMENT_STATUS_LABELS[p.status]" :meta="PAYMENT_STATUS_META[p.status]" size="sm" class="shrink-0" />
              </div>
            </ListRow>
          </li>
        </ul>
      </AppSection>
    </template>
  </div>
</template>
