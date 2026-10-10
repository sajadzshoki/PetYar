<script setup lang="ts">
import type { BookingDispute } from '~~/shared/types/moderation'
import { DISPUTE_STATUS_LABELS } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const disputes = ref<BookingDispute[]>([])
const error = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { disputes: BookingDispute[] } }>('/api/admin/disputes')
    disputes.value = res.data.disputes
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

useHead({ title: 'اختلاف‌ها | مدیریت پت‌یار' })
</script>

<template>
  <div class="max-w-content">
    <PageHeader title="اختلاف‌ها" compact />

    <SkeletonList v-if="loading" :rows="4" />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />
    <AppState v-else-if="!disputes.length" icon="i-lucide-scale" title="اختلافی ثبت نشده" compact />
    <ul v-else class="surface divide-y divide-muted">
      <li v-for="d in disputes" :key="d.id">
        <ListRow :to="`/admin/disputes/${d.id}`">
          <p class="font-semibold text-highlighted">{{ d.openerName }}</p>
          <p class="mt-0.5 truncate text-sm text-muted">{{ d.reason }}</p>
          <p class="mt-0.5 text-xs text-dimmed">{{ formatRelative(d.createdAt) }}</p>
          <template #trailing>
            <StatusBadge :label="DISPUTE_STATUS_LABELS[d.status]" :meta="DISPUTE_STATUS_META[d.status]" size="sm" class="shrink-0" />
          </template>
        </ListRow>
      </li>
    </ul>
  </div>
</template>
