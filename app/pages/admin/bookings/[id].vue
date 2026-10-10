<script setup lang="ts">
import { BOOKING_STATUS_LABELS, type BookingStatus } from '~~/shared/constants/bookings'
import { apiErrorMessage } from '~/utils/api-error'

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
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { booking: Row } }>(`/api/admin/bookings/${route.params.id}`)
    booking.value = res.data.booking
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'رزرو یافت نشد')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

useHead({ title: 'رزرو | مدیریت پت‌یار' })
</script>

<template>
  <div class="max-w-content">
    <PageHeader :title="booking?.serviceTitle || 'رزرو'" compact :back="{ to: '/admin/bookings', label: 'رزروها' }" />

    <SkeletonList v-if="loading" :rows="2" />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />

    <AppSection v-else-if="booking">
      <StatusBadge :label="BOOKING_STATUS_LABELS[booking.status]" :meta="BOOKING_STATUS_META[booking.status]" />
      <dl class="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-xs text-muted">صاحب حیوان</dt>
          <dd class="font-medium text-highlighted">{{ booking.ownerName }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted">حیوان</dt>
          <dd class="font-medium text-highlighted">{{ booking.petName }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted">ارائه‌دهنده</dt>
          <dd class="font-medium text-highlighted">{{ booking.providerName }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted">زمان شروع (تهران)</dt>
          <dd class="font-medium text-highlighted">{{ formatDateTime(booking.startAt) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted">مبلغ</dt>
          <dd class="font-medium text-highlighted">{{ booking.totalAmount != null ? formatToman(booking.totalAmount) : 'توافقی' }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted">شناسه</dt>
          <dd class="font-mono text-xs text-highlighted"><span class="ltr">{{ booking.id }}</span></dd>
        </div>
      </dl>
    </AppSection>
  </div>
</template>
