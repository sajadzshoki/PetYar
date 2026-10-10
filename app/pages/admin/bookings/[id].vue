<script setup lang="ts">
import { BOOKING_STATUS_LABELS, type BookingStatus } from '~~/shared/constants/bookings'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

interface Row {
  id: string
  status: BookingStatus
  ownerName: string
  petName: string
  providerName: string
  serviceTitle: string
  startAt: string
  totalAmount: string | null
}

const route = useRoute()
const booking = ref<Row | null>(null)

onMounted(async () => {
  const res = await $fetch<{ data: { booking: Row } }>(`/api/admin/bookings/${route.params.id}`)
  booking.value = res.data.booking
})
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-10">
    <NuxtLink to="/admin/bookings" class="text-sm text-ink-600">رزروها</NuxtLink>
    <template v-if="booking">
      <h1 class="mt-3 text-2xl font-semibold">{{ booking.serviceTitle }}</h1>
      <p class="mt-2 text-sm">{{ BOOKING_STATUS_LABELS[booking.status] }}</p>
      <p class="mt-2 text-sm">صاحب: {{ booking.ownerName }} · حیوان: {{ booking.petName }}</p>
      <p class="mt-1 text-sm">ارائه‌دهنده: {{ booking.providerName }}</p>
      <p class="mt-1 text-sm">{{ new Date(booking.startAt).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' }) }}</p>
    </template>
  </div>
</template>
