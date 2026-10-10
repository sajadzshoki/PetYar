<script setup lang="ts">
import type { SafetyReport } from '~~/shared/types/moderation'
import { REPORT_REASONS, REPORT_REASON_LABELS, REPORT_STATUS_LABELS, REPORT_TARGET_LABELS, REPORT_TARGET_TYPES, type ReportTargetType } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const toast = useToast()
const pending = ref(false)
const error = ref('')
const mine = ref<SafetyReport[]>([])
const mineError = ref('')

const form = reactive({
  targetType: (String(route.query.type || 'PROVIDER') as ReportTargetType),
  targetId: String(route.query.id || ''),
  reason: 'OTHER' as (typeof REPORT_REASONS)[number],
  description: '',
})

const targetOptions = REPORT_TARGET_TYPES.map(t => ({ label: REPORT_TARGET_LABELS[t], value: t }))
const reasonOptions = REPORT_REASONS.map(r => ({ label: REPORT_REASON_LABELS[r], value: r }))
const prefilled = computed(() => Boolean(route.query.id))

async function loadMine() {
  mineError.value = ''
  try {
    const res = await $fetch<{ data: { reports: SafetyReport[] } }>('/api/reports')
    mine.value = res.data.reports
  }
  catch (err) {
    mineError.value = apiErrorMessage(err, 'گزارش‌های قبلی بارگذاری نشد')
  }
}

async function submit() {
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/reports', { method: 'POST', body: { ...form } })
    toast.add({ title: 'گزارش ثبت شد', description: 'تیم ایمنی آن را بررسی می‌کند.', icon: 'i-lucide-check', color: 'success' })
    form.description = ''
    await loadMine()
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'ارسال گزارش ناموفق بود')
  }
  finally {
    pending.value = false
  }
}

onMounted(loadMine)

useHead({ title: 'گزارش تخلف | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-narrow px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="گزارش تخلف" description="گزارش شما فقط برای تیم ایمنی دیده می‌شود و محرمانه می‌ماند." />

    <form class="space-y-5" @submit.prevent="submit">
      <AppSection title="مورد گزارش">
        <div class="space-y-4">
          <UFormField label="نوع" name="targetType">
            <USelect v-model="form.targetType" :items="targetOptions" class="w-full" :disabled="prefilled" />
          </UFormField>
          <UFormField label="شناسه" name="targetId" :help="prefilled ? 'از صفحه قبلی پر شده است.' : 'شناسه کاربر، ارائه‌دهنده، رزرو یا نظر'">
            <UInput v-model="form.targetId" class="w-full ltr" :readonly="prefilled" />
          </UFormField>
        </div>
      </AppSection>

      <AppSection title="شرح">
        <div class="space-y-4">
          <UFormField label="دلیل" name="reason">
            <USelect v-model="form.reason" :items="reasonOptions" class="w-full" />
          </UFormField>
          <UFormField label="توضیح" name="description" help="هرچه دقیق‌تر بنویسید، بررسی سریع‌تر انجام می‌شود.">
            <UTextarea v-model="form.description" class="w-full" :rows="5" />
          </UFormField>
        </div>
      </AppSection>

      <InlineMessage :message="error" />
      <UButton type="submit" block :loading="pending" :disabled="!form.targetId.trim()" icon="i-lucide-flag">ارسال گزارش</UButton>
    </form>

    <AppSection title="گزارش‌های شما" class="mt-8" flush>
      <InlineMessage :message="mineError" class="mx-4 mb-4" />
      <p v-if="!mine.length && !mineError" class="px-4 pb-4 text-sm text-muted sm:px-5">هنوز گزارشی نفرستاده‌اید.</p>
      <ul v-else-if="mine.length" class="divide-y divide-muted border-t border-muted text-sm">
        <li v-for="item in mine" :key="item.id" class="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div class="min-w-0">
            <p class="font-medium text-highlighted">{{ REPORT_TARGET_LABELS[item.targetType] }} · {{ REPORT_REASON_LABELS[item.reason] }}</p>
            <p class="mt-0.5 text-xs text-dimmed">{{ formatDate(item.createdAt) }}</p>
          </div>
          <StatusBadge :label="REPORT_STATUS_LABELS[item.status]" :meta="REPORT_STATUS_META[item.status]" size="sm" class="shrink-0" />
        </li>
      </ul>
    </AppSection>
  </div>
</template>
