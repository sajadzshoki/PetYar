<script setup lang="ts">
import type { SafetyReport } from '~~/shared/types/moderation'
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS, REPORT_TARGET_LABELS } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const route = useRoute()
const toast = useToast()
const report = ref<SafetyReport | null>(null)
const note = ref('')
const error = ref('')
const loadError = ref('')
const loading = ref(true)
const pending = ref<string | null>(null)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await $fetch<{ data: { report: SafetyReport } }>(`/api/admin/reports/${route.params.id}`)
    report.value = res.data.report
  }
  catch (err) {
    loadError.value = apiErrorMessage(err, 'گزارش یافت نشد')
  }
  finally {
    loading.value = false
  }
}

async function act(action: 'resolve' | 'dismiss') {
  if (!report.value) return
  pending.value = action
  error.value = ''
  try {
    const res = await $fetch<{ data: { report: SafetyReport } }>(`/api/admin/reports/${report.value.id}/${action}`, { method: 'POST', body: { note: note.value } })
    report.value = res.data.report
    toast.add({ title: 'گزارش به‌روز شد', icon: 'i-lucide-check', color: 'success' })
    note.value = ''
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'انجام نشد')
  }
  finally {
    pending.value = null
  }
}

const targetLink = computed(() => {
  const r = report.value
  if (!r) return null
  switch (r.targetType) {
    case 'PROVIDER': return `/admin/providers/${r.targetId}`
    case 'USER': return `/admin/users/${r.targetId}`
    case 'BOOKING': return `/admin/bookings/${r.targetId}`
    case 'REVIEW': return '/admin/reviews'
    default: return null
  }
})

const open = computed(() => report.value?.status === 'OPEN' || report.value?.status === 'IN_REVIEW')

onMounted(load)

useHead({ title: 'گزارش | مدیریت پت‌یار' })
</script>

<template>
  <div class="max-w-content">
    <PageHeader :title="report ? `${REPORT_TARGET_LABELS[report.targetType]} · ${REPORT_REASON_LABELS[report.reason]}` : 'گزارش'" compact :back="{ to: '/admin/reports', label: 'گزارش‌ها' }">
      <template v-if="report" #meta>
        <div class="mt-3">
          <StatusBadge :label="REPORT_STATUS_LABELS[report.status]" :meta="REPORT_STATUS_META[report.status]" />
        </div>
      </template>
      <template v-if="targetLink" #actions>
        <UButton :to="targetLink" color="neutral" variant="outline" size="md" icon="i-lucide-external-link">مورد گزارش</UButton>
      </template>
    </PageHeader>

    <SkeletonList v-if="loading" :rows="2" />
    <AppState v-else-if="loadError" variant="error" :title="loadError" retry @retry="load" />

    <template v-else-if="report">
      <AppSection title="شرح گزارش">
        <dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-xs text-muted">گزارش‌دهنده</dt>
            <dd class="font-medium text-highlighted">{{ report.reporterName }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted">زمان</dt>
            <dd class="font-medium text-highlighted">{{ formatDateTime(report.createdAt) }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-xs text-muted">شناسه مورد</dt>
            <dd class="font-mono text-xs text-highlighted"><span class="ltr">{{ report.targetId }}</span></dd>
          </div>
        </dl>
        <p class="mt-4 rounded-lg bg-canvas-deep p-3 text-sm leading-7 text-default">{{ report.description || 'بدون توضیح' }}</p>
        <p v-if="report.resolutionNote" class="mt-3 text-sm text-muted">یادداشت رسیدگی: {{ report.resolutionNote }}</p>
      </AppSection>

      <AppSection v-if="open" title="رسیدگی" class="mt-6">
        <UFormField label="یادداشت رسیدگی" name="note">
          <UTextarea v-model="note" class="w-full" :rows="3" />
        </UFormField>
        <InlineMessage :message="error" class="mt-3" />
        <div class="mt-4 flex flex-wrap gap-2">
          <UButton icon="i-lucide-check" :loading="pending === 'resolve'" :disabled="Boolean(pending)" @click="act('resolve')">رسیدگی شد</UButton>
          <UButton color="neutral" variant="outline" icon="i-lucide-x" :loading="pending === 'dismiss'" :disabled="Boolean(pending)" @click="act('dismiss')">رد گزارش</UButton>
        </div>
      </AppSection>
    </template>
  </div>
</template>
