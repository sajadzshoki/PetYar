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
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { bookings: Row[] } }>('/api/admin/bookings')
    bookings.value = res.data.bookings
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

useHead({ title: 'رزروها | مدیریت پت‌یار' })
</script>

<template>
  <div class="max-w-content">
    <PageHeader title="رزروها" compact />

    <SkeletonList v-if="loading" :rows="5" />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />
    <AppState v-else-if="!bookings.length" icon="i-lucide-calendar" title="رزروی ثبت نشده" compact />
    <ul v-else class="surface divide-y divide-muted">
      <li v-for="b in bookings" :key="b.id">
        <ListRow :to="`/admin/bookings/${b.id}`">
          <p class="font-semibold text-highlighted">{{ b.serviceTitle }}</p>
          <p class="mt-0.5 text-sm text-muted">{{ b.ownerName }} ← {{ b.providerName }} · {{ formatDateTime(b.startAt) }}</p>
          <template #trailing>
            <StatusBadge :label="BOOKING_STATUS_LABELS[b.status]" :meta="BOOKING_STATUS_META[b.status]" size="sm" class="shrink-0" />
          </template>
        </ListRow>
      </li>
    </ul>
  </div>
</template>
