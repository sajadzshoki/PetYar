<script setup lang="ts">
import { BOOKING_STATUS_LABELS, type BookingStatus } from '~~/shared/constants/bookings'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

interface Row {
  id: string
  status: BookingStatus
  ownerName: string
  providerName: string
  serviceTitle: string
  startAt: string
}

const bookings = ref<Row[]>([])
const error = ref('')

onMounted(async () => {
  try {
    const res = await $fetch<{ data: { bookings: Row[] } }>('/api/admin/bookings')
    bookings.value = res.data.bookings
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'خطا')
  }
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-semibold">رزروها</h1>
    <p v-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
    <ul class="mt-6 divide-y divide-ink-100 text-sm">
      <li v-for="b in bookings" :key="b.id" class="py-3">
        <NuxtLink :to="`/admin/bookings/${b.id}`" class="flex justify-between gap-3">
          <span>{{ b.serviceTitle }} · {{ b.ownerName }} / {{ b.providerName }}</span>
          <span class="text-ink-500">{{ BOOKING_STATUS_LABELS[b.status] }}</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
