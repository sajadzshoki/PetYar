<script setup lang="ts">
import type { SafetyReport } from '~~/shared/types/moderation'
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS, REPORT_TARGET_LABELS } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const reports = ref<SafetyReport[]>([])
const error = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { reports: SafetyReport[] } }>('/api/admin/reports')
    reports.value = res.data.reports
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

useHead({ title: 'گزارش‌ها | مدیریت پت‌یار' })
</script>

<template>
  <div class="max-w-content">
    <PageHeader title="گزارش‌ها" compact />

    <SkeletonList v-if="loading" :rows="4" />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />
    <AppState v-else-if="!reports.length" icon="i-lucide-flag" title="گزارشی ثبت نشده" compact />
    <ul v-else class="surface divide-y divide-muted">
      <li v-for="r in reports" :key="r.id">
        <ListRow :to="`/admin/reports/${r.id}`">
          <p class="font-semibold text-highlighted">{{ REPORT_TARGET_LABELS[r.targetType] }} · {{ REPORT_REASON_LABELS[r.reason] }}</p>
          <p class="mt-0.5 truncate text-sm text-muted">{{ r.reporterName }} · {{ formatRelative(r.createdAt) }}</p>
          <template #trailing>
            <StatusBadge :label="REPORT_STATUS_LABELS[r.status]" :meta="REPORT_STATUS_META[r.status]" size="sm" class="shrink-0" />
          </template>
        </ListRow>
      </li>
    </ul>
  </div>
</template>
