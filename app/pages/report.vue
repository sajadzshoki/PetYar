<script setup lang="ts">
import { REPORT_REASONS, REPORT_REASON_LABELS, REPORT_TARGET_TYPES, type ReportTargetType } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const pending = ref(false)
const error = ref('')
const ok = ref('')

const form = reactive({
  targetType: (String(route.query.type || 'PROVIDER') as ReportTargetType),
  targetId: String(route.query.id || ''),
  reason: 'OTHER' as (typeof REPORT_REASONS)[number],
  description: '',
})

async function submit() {
  pending.value = true
  error.value = ''
  ok.value = ''
  try {
    await $fetch('/api/reports', { method: 'POST', body: { ...form } })
    ok.value = 'گزارش ثبت شد و به صف بررسی رفت.'
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'خطا')
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-10">
    <h1 class="text-2xl font-semibold">گزارش تخلف</h1>
    <p class="mt-2 text-sm leading-7 text-ink-600">گزارش شما فقط برای تیم ایمنی دیده می‌شود.</p>
    <form class="mt-8 space-y-4" @submit.prevent="submit">
      <UFormField label="نوع">
        <select v-model="form.targetType" class="w-full border border-ink-200 bg-paper px-3 py-2 text-sm">
          <option v-for="t in REPORT_TARGET_TYPES" :key="t" :value="t">{{ t }}</option>
        </select>
      </UFormField>
      <UFormField label="شناسه">
        <UInput v-model="form.targetId" class="w-full" dir="ltr" />
      </UFormField>
      <UFormField label="دلیل">
        <select v-model="form.reason" class="w-full border border-ink-200 bg-paper px-3 py-2 text-sm">
          <option v-for="r in REPORT_REASONS" :key="r" :value="r">{{ REPORT_REASON_LABELS[r] }}</option>
        </select>
      </UFormField>
      <UFormField label="شرح">
        <UTextarea v-model="form.description" class="w-full" :rows="5" />
      </UFormField>
      <p v-if="error" class="text-sm text-terracotta-700">{{ error }}</p>
      <p v-if="ok" class="text-sm text-forest-700">{{ ok }}</p>
      <UButton type="submit" :loading="pending">ارسال گزارش</UButton>
    </form>
  </div>
</template>
