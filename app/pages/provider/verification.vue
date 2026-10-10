<script setup lang="ts">
import type { VerificationApplication } from '~~/shared/types/moderation'
import {
  VERIFICATION_DOCUMENT_KINDS,
  VERIFICATION_DOCUMENT_LABELS,
  VERIFICATION_STATUS_LABELS,
} from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const application = ref<VerificationApplication | null>(null)
const loading = ref(true)
const pending = ref(false)
const error = ref('')
const ok = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const kind = ref<(typeof VERIFICATION_DOCUMENT_KINDS)[number]>('NATIONAL_ID')

const form = reactive({
  legalName: '',
  nationalId: '',
  city: '',
  notes: '',
})

function fill(a: VerificationApplication | null) {
  application.value = a
  if (!a) return
  form.legalName = a.legalName
  form.nationalId = a.nationalId || ''
  form.city = a.city || ''
  form.notes = a.notes || ''
}

async function load() {
  loading.value = true
  try {
    const res = await $fetch<{ data: { application: VerificationApplication | null } }>('/api/provider/verification')
    fill(res.data.application)
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

async function save() {
  pending.value = true
  error.value = ''
  ok.value = ''
  try {
    const res = await $fetch<{ data: { application: VerificationApplication } }>('/api/provider/verification', {
      method: 'PATCH',
      body: { ...form },
    })
    fill(res.data.application)
    ok.value = 'ذخیره شد'
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'خطا')
  }
  finally {
    pending.value = false
  }
}

async function submit() {
  pending.value = true
  error.value = ''
  try {
    await save()
    const res = await $fetch<{ data: { application: VerificationApplication } }>('/api/provider/verification/submit', { method: 'POST' })
    fill(res.data.application)
    ok.value = 'برای بررسی ارسال شد'
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'خطا')
  }
  finally {
    pending.value = false
  }
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const body = new FormData()
  body.append('file', file)
  body.append('kind', kind.value)
  try {
    const res = await $fetch<{ data: { application: VerificationApplication } }>('/api/provider/verification/documents', { method: 'POST', body })
    fill(res.data.application)
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'خطا')
  }
  ;(e.target as HTMLInputElement).value = ''
}

const canEdit = computed(() => {
  const s = application.value?.status
  return !s || s === 'UNVERIFIED' || s === 'NEEDS_CHANGES' || s === 'REJECTED'
})

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-10">
    <h1 class="text-2xl font-semibold">احراز هویت</h1>
    <p class="mt-2 text-sm leading-7 text-ink-600">مدارک فقط برای بررسی مدیر ذخیره می‌شود. نشان تأیید فقط پس از تصویب واقعی نمایش داده می‌شود.</p>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <template v-else>
      <p v-if="application" class="mt-3 text-sm">وضعیت: {{ VERIFICATION_STATUS_LABELS[application.status] }}</p>
      <p v-if="application?.reviewNote" class="mt-2 text-sm leading-7 text-ink-700">یادداشت مدیر: {{ application.reviewNote }}</p>
      <form class="mt-8 space-y-4" @submit.prevent="save">
        <UFormField label="نام حقوقی / نام روی مدرک">
          <UInput v-model="form.legalName" class="w-full" :disabled="!canEdit" />
        </UFormField>
        <UFormField label="کد ملی">
          <UInput v-model="form.nationalId" class="w-full" dir="ltr" maxlength="10" :disabled="!canEdit" />
        </UFormField>
        <UFormField label="شهر">
          <UInput v-model="form.city" class="w-full" :disabled="!canEdit" />
        </UFormField>
        <UFormField label="توضیح">
          <UTextarea v-model="form.notes" class="w-full" :disabled="!canEdit" />
        </UFormField>
        <p v-if="error" class="text-sm text-terracotta-700">{{ error }}</p>
        <p v-if="ok" class="text-sm text-forest-700">{{ ok }}</p>
        <UButton v-if="canEdit" type="submit" :loading="pending" color="neutral" variant="outline">ذخیره پیش‌نویس</UButton>
      </form>

      <section class="mt-10">
        <h2 class="text-lg font-medium">مدارک</h2>
        <div class="mt-4 grid grid-cols-2 gap-2">
          <div v-for="doc in application?.documents || []" :key="doc.id">
            <img :src="doc.imageUrl" alt="" class="h-28 w-full object-cover ring-1 ring-ink-200">
            <p class="mt-1 text-xs">{{ VERIFICATION_DOCUMENT_LABELS[doc.kind] }}</p>
          </div>
        </div>
        <template v-if="canEdit">
          <select v-model="kind" class="mt-4 w-full border border-ink-200 bg-paper px-3 py-2 text-sm">
            <option v-for="k in VERIFICATION_DOCUMENT_KINDS" :key="k" :value="k">{{ VERIFICATION_DOCUMENT_LABELS[k] }}</option>
          </select>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onFile">
          <UButton class="mt-3" size="sm" color="neutral" variant="outline" @click="fileInput?.click()">افزودن تصویر مدرک</UButton>
          <UButton class="mt-4 block" :loading="pending" @click="submit">ارسال برای بررسی</UButton>
        </template>
      </section>
    </template>
  </div>
</template>
