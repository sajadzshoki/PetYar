<script setup lang="ts">
import type { SafetyReport } from '~~/shared/types/moderation'
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS, REPORT_TARGET_LABELS } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const route = useRoute()
const report = ref<SafetyReport | null>(null)
const note = ref('')
const error = ref('')
const pending = ref(false)

async function load() {
  const res = await $fetch<{ data: { report: SafetyReport } }>(`/api/admin/reports/${route.params.id}`)
  report.value = res.data.report
}

async function act(path: string) {
  pending.value = true
  try {
    const res = await $fetch<{ data: { report: SafetyReport } }>(path, { method: 'POST', body: { note: note.value } })
    report.value = res.data.report
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'خطا')
  }
  finally {
    pending.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-10">
    <NuxtLink to="/admin/reports" class="text-sm text-ink-600">گزارش‌ها</NuxtLink>
    <template v-if="report">
      <h1 class="mt-3 text-2xl font-semibold">{{ REPORT_TARGET_LABELS[report.targetType] }}</h1>
      <p class="mt-2 text-sm">{{ REPORT_STATUS_LABELS[report.status] }} · {{ REPORT_REASON_LABELS[report.reason] }}</p>
      <p class="mt-2 text-sm">گزارش‌دهنده: {{ report.reporterName }}</p>
      <p class="mt-4 text-sm leading-7">{{ report.description }}</p>
      <UTextarea v-model="note" class="mt-6 w-full" placeholder="یادداشت رسیدگی" />
      <p v-if="error" class="mt-2 text-sm text-terracotta-700">{{ error }}</p>
      <div class="mt-4 flex gap-2">
        <UButton :loading="pending" @click="act(`/api/admin/reports/${report.id}/resolve`)">رسیدگی شد</UButton>
        <UButton :loading="pending" color="neutral" variant="outline" @click="act(`/api/admin/reports/${report.id}/dismiss`)">رد گزارش</UButton>
      </div>
    </template>
  </div>
</template>
