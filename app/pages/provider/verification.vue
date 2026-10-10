<script setup lang="ts">
import type { VerificationApplication } from '~~/shared/types/moderation'
import {
  VERIFICATION_DOCUMENT_KINDS,
  VERIFICATION_DOCUMENT_LABELS,
  VERIFICATION_STATUS_LABELS,
} from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const toast = useToast()
const application = ref<VerificationApplication | null>(null)
const loading = ref(true)
const pending = ref(false)
const submitting = ref(false)
const uploading = ref(false)
const error = ref('')
const loadError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const kind = ref<(typeof VERIFICATION_DOCUMENT_KINDS)[number]>('NATIONAL_ID')
const confirmOpen = ref(false)

const form = reactive({
  legalName: '',
  nationalId: '',
  city: '',
  notes: '',
})

const kindItems = VERIFICATION_DOCUMENT_KINDS.map(value => ({ label: VERIFICATION_DOCUMENT_LABELS[value], value }))

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
  loadError.value = ''
  try {
    const res = await $fetch<{ data: { application: VerificationApplication | null } }>('/api/provider/verification')
    fill(res.data.application)
  }
  catch (err) {
    loadError.value = apiErrorMessage(err, 'بارگذاری ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

async function saveDraft(silent = false) {
  const res = await $fetch<{ data: { application: VerificationApplication } }>('/api/provider/verification', {
    method: 'PATCH',
    body: { ...form },
  })
  fill(res.data.application)
  if (!silent) toast.add({ title: 'پیش‌نویس ذخیره شد', icon: 'i-lucide-check', color: 'success' })
}

async function save() {
  pending.value = true
  error.value = ''
  try {
    await saveDraft()
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'ذخیره ناموفق بود')
  }
  finally {
    pending.value = false
  }
}

async function submit() {
  submitting.value = true
  error.value = ''
  try {
    await saveDraft(true)
    const res = await $fetch<{ data: { application: VerificationApplication } }>('/api/provider/verification/submit', { method: 'POST' })
    fill(res.data.application)
    confirmOpen.value = false
    toast.add({ title: 'برای بررسی ارسال شد', description: 'نتیجه از طریق اعلان به شما اطلاع داده می‌شود.', icon: 'i-lucide-send', color: 'success' })
  }
  catch (err) {
    confirmOpen.value = false
    error.value = apiErrorMessage(err, 'ارسال ناموفق بود')
  }
  finally {
    submitting.value = false
  }
}

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const body = new FormData()
  body.append('file', file)
  body.append('kind', kind.value)
  uploading.value = true
  try {
    const res = await $fetch<{ data: { application: VerificationApplication } }>('/api/provider/verification/documents', { method: 'POST', body })
    fill(res.data.application)
    toast.add({ title: 'مدرک اضافه شد', icon: 'i-lucide-check', color: 'success' })
  }
  catch (err) {
    toast.add({ title: apiErrorMessage(err, 'آپلود مدرک ناموفق بود'), color: 'error', icon: 'i-lucide-circle-alert' })
  }
  finally {
    uploading.value = false
  }
}

const canEdit = computed(() => {
  const s = application.value?.status
  return !s || s === 'UNVERIFIED' || s === 'NEEDS_CHANGES' || s === 'REJECTED'
})

const status = computed(() => application.value?.status || 'UNVERIFIED')
const docs = computed(() => application.value?.documents || [])

onMounted(load)

useHead({ title: 'احراز هویت | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-narrow px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="احراز هویت" description="مدارک فقط برای بررسی مدیر ذخیره می‌شود و عمومی نیست. نشان تأیید پس از تصویب نمایش داده می‌شود.">
      <template #meta>
        <div v-if="application" class="mt-3">
          <StatusBadge :label="VERIFICATION_STATUS_LABELS[status]" :meta="VERIFICATION_STATUS_META[status]" />
        </div>
      </template>
    </PageHeader>

    <SkeletonList v-if="loading" :rows="3" />
    <AppState v-else-if="loadError" variant="error" :title="loadError" retry @retry="load" />

    <template v-else>
      <UAlert
        v-if="status === 'PENDING'"
        class="mb-5"
        color="warning"
        variant="subtle"
        icon="i-lucide-clock"
        title="در صف بررسی"
        :description="application?.submittedAt ? `ارسال‌شده در ${formatDateTime(application.submittedAt)}. تا پایان بررسی امکان ویرایش نیست.` : 'تا پایان بررسی امکان ویرایش نیست.'"
      />
      <UAlert
        v-else-if="status === 'APPROVED'"
        class="mb-5"
        color="success"
        variant="subtle"
        icon="i-lucide-badge-check"
        title="هویت شما تأیید شده است"
        description="نشان تأیید در پرونده عمومی شما نمایش داده می‌شود."
      />
      <UAlert
        v-else-if="application?.reviewNote"
        class="mb-5"
        :color="status === 'REJECTED' ? 'error' : 'warning'"
        variant="subtle"
        icon="i-lucide-message-square-text"
        title="یادداشت مدیر"
        :description="application.reviewNote"
      />

      <form class="space-y-5" @submit.prevent="save">
        <AppSection title="مشخصات" description="باید با مدارک بارگذاری‌شده مطابقت داشته باشد.">
          <div class="space-y-4">
            <UFormField label="نام حقوقی / نام روی مدرک" name="legalName" required>
              <UInput v-model="form.legalName" class="w-full" :disabled="!canEdit" autocomplete="name" />
            </UFormField>
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="کد ملی" name="nationalId">
                <UInput v-model="form.nationalId" class="w-full ltr" inputmode="numeric" maxlength="10" :disabled="!canEdit" />
              </UFormField>
              <UFormField label="شهر" name="city">
                <UInput v-model="form.city" class="w-full" :disabled="!canEdit" />
              </UFormField>
            </div>
            <UFormField label="توضیح" name="notes" help="اختیاری؛ مثلاً نوع فعالیت یا مجوزها.">
              <UTextarea v-model="form.notes" class="w-full" :rows="3" :disabled="!canEdit" />
            </UFormField>
          </div>
          <InlineMessage :message="error" class="mt-4" />
          <div v-if="canEdit" class="mt-4 flex flex-wrap gap-2">
            <UButton type="submit" :loading="pending" color="neutral" variant="outline" size="md" icon="i-lucide-save">ذخیره پیش‌نویس</UButton>
          </div>
        </AppSection>
      </form>

      <AppSection title="مدارک" :description="canEdit ? 'تصویر واضح از کارت ملی و یک سلفی برای تطبیق چهره لازم است.' : ''" class="mt-6">
        <ul v-if="docs.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <li v-for="doc in docs" :key="doc.id" class="overflow-hidden rounded-lg ring-1 ring-default">
            <img :src="doc.imageUrl" alt="" class="aspect-[4/3] w-full object-cover" loading="lazy">
            <p class="bg-canvas px-2 py-1.5 text-xs font-medium text-default">{{ VERIFICATION_DOCUMENT_LABELS[doc.kind] }}</p>
          </li>
        </ul>
        <p v-else class="text-sm text-muted">هنوز مدرکی بارگذاری نشده.</p>

        <div v-if="canEdit" class="mt-4 flex flex-col gap-3 border-t border-muted pt-4 sm:flex-row sm:items-end">
          <UFormField label="نوع مدرک" name="kind" class="flex-1">
            <USelect v-model="kind" :items="kindItems" class="w-full" />
          </UFormField>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onFile">
          <UButton color="neutral" variant="outline" size="md" icon="i-lucide-upload" :loading="uploading" @click="fileInput?.click()">افزودن تصویر</UButton>
        </div>
      </AppSection>

      <div v-if="canEdit" class="mt-6">
        <UButton block icon="i-lucide-send" :disabled="!form.legalName.trim() || !docs.length" @click="confirmOpen = true">ارسال برای بررسی</UButton>
        <p v-if="!docs.length" class="mt-2 text-center text-xs text-muted">برای ارسال، حداقل یک مدرک بارگذاری کنید.</p>
      </div>

      <UModal v-model:open="confirmOpen" title="ارسال برای بررسی" description="پس از ارسال، تا پایان بررسی امکان ویرایش مشخصات و مدارک وجود ندارد.">
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton color="neutral" variant="ghost" size="md" @click="confirmOpen = false">انصراف</UButton>
            <UButton size="md" icon="i-lucide-send" :loading="submitting" @click="submit">ارسال</UButton>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
