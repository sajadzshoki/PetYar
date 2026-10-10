<script setup lang="ts">
import type { SafetyReport } from '~~/shared/types/moderation'
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS, REPORT_TARGET_LABELS } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const reports = ref<SafetyReport[]>([])
const error = ref('')

onMounted(async () => {
  try {
    const res = await $fetch<{ data: { reports: SafetyReport[] } }>('/api/admin/reports')
    reports.value = res.data.reports
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'خطا')
  }
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-semibold">گزارش‌ها</h1>
    <p v-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
    <ul class="mt-6 divide-y divide-ink-100 text-sm">
      <li v-for="r in reports" :key="r.id" class="py-3">
        <NuxtLink :to="`/admin/reports/${r.id}`" class="flex justify-between gap-3">
          <span>{{ REPORT_TARGET_LABELS[r.targetType] }} · {{ REPORT_REASON_LABELS[r.reason] }} · {{ r.reporterName }}</span>
          <span class="text-ink-500">{{ REPORT_STATUS_LABELS[r.status] }}</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
