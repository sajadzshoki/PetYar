<script setup lang="ts">
import type { Booking } from '~~/shared/types/booking'
import { BOOKING_STATUS_LABELS } from '~~/shared/constants/bookings'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const items = ref<Booking[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  try {
    const res = await $fetch<{ data: { bookings: Booking[] } }>('/api/provider/bookings')
    items.value = res.data.bookings
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-12">
    <NuxtLink to="/provider" class="text-sm text-ink-600">پرونده ارائه‌دهنده</NuxtLink>
    <h1 class="mt-3 text-2xl font-semibold">درخواست‌های رزرو</h1>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <p v-else-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
    <p v-else-if="!items.length" class="mt-8 text-sm text-ink-500">درخواستی نیست.</p>
    <ul v-else class="mt-8 divide-y divide-ink-200">
      <li v-for="item in items" :key="item.id" class="py-4">
        <NuxtLink :to="`/provider/bookings/${item.id}`" class="block">
          <p class="font-medium">{{ item.serviceTitle }} · {{ item.petName }}</p>
          <p class="mt-1 text-sm text-ink-600">{{ BOOKING_STATUS_LABELS[item.status] }}</p>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
