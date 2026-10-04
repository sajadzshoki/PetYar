<script setup lang="ts">
import type { Booking } from '~~/shared/types/booking'
import { BOOKING_STATUS_LABELS } from '~~/shared/constants/bookings'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const items = ref<Booking[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { bookings: Booking[] } }>('/api/bookings')
    items.value = res.data.bookings
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری رزروها ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

function money(b: Booking) {
  if (b.negotiable || b.totalAmount == null) return 'توافقی'
  return `${new Intl.NumberFormat('fa-IR').format(b.totalAmount)} تومان`
}

function when(b: Booking) {
  return new Date(b.startAt).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-12">
    <h1 class="text-2xl font-semibold">رزروهای من</h1>
    <p class="mt-2 text-sm leading-7 text-ink-600">مبلغ رزرو روی سرور حساب می‌شود. پرداخت فقط با درگاه پیکربندی‌شده قطعی می‌شود.</p>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <AppState v-else-if="error" :title="error" />
    <p v-else-if="!items.length" class="mt-8 text-sm text-ink-500">رزروی ندارید.</p>
    <ul v-else class="mt-8 divide-y divide-ink-200">
      <li v-for="item in items" :key="item.id" class="py-4">
        <NuxtLink :to="`/bookings/${item.id}`" class="block">
          <p class="font-medium">{{ item.serviceTitle }} · {{ item.providerName }}</p>
          <p class="mt-1 text-sm text-ink-600">{{ item.petName }} · {{ when(item) }}</p>
          <p class="mt-1 text-sm text-ink-700">{{ BOOKING_STATUS_LABELS[item.status] }} · {{ money(item) }}</p>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
