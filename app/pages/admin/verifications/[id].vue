<script setup lang="ts">
import type { VerificationApplication } from '~~/shared/types/moderation'
import { VERIFICATION_DOCUMENT_LABELS, VERIFICATION_STATUS_LABELS } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const route = useRoute()
const toast = useToast()
const application = ref<VerificationApplication | null>(null)
const note = ref('')
const error = ref('')
const loadError = ref('')
const loading = ref(true)
const pending = ref<string | null>(null)
const preview = ref<string | null>(null)

const previewOpen = computed({
  get: () => Boolean(preview.value),
  set: (v: boolean) => {
    if (!v) preview.value = null
  },
})

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await $fetch<{ data: { application: VerificationApplication } }>(`/api/admin/verifications/${route.params.id}`)
    application.value = res.data.application
  }
  catch (err) {
    loadError.value = apiErrorMessage(err, 'درخواست یافت نشد')
  }
  finally {
    loading.value = false
  }
}

async function act(action: 'approve' | 'request-changes' | 'reject') {
  if (!application.value) return
  pending.value = action
  error.value = ''
  try {
    const res = await $fetch<{ data: { application: VerificationApplication } }>(`/api/admin/verifications/${application.value.id}/${action}`, { method: 'POST', body: { note: note.value } })
    application.value = res.data.application
    toast.add({ title: 'تصمیم ثبت شد', icon: 'i-lucide-check', color: 'success' })
    note.value = ''
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'انجام نشد')
  }
  finally {
    pending.value = null
  }
}

const reviewable = computed(() => application.value?.status === 'PENDING' || application.value?.status === 'NEEDS_CHANGES')

onMounted(load)

useHead(() => ({ title: `${application.value?.providerName || 'احراز هویت'} | مدیریت پت‌یار` }))
</script>

<template>
  <div class="max-w-content">
    <PageHeader :title="application?.providerName || 'درخواست احراز هویت'" compact :back="{ to: '/admin/verifications', label: 'احراز هویت' }">
      <template v-if="application" #meta>
        <div class="mt-3">
          <StatusBadge :label="VERIFICATION_STATUS_LABELS[application.status]" :meta="VERIFICATION_STATUS_META[application.status]" />
        </div>
      </template>
      <template v-if="application" #actions>
        <UButton :to="`/providers/${application.providerId}`" color="neutral" variant="outline" size="md" icon="i-lucide-eye">صفحه عمومی</UButton>
      </template>
    </PageHeader>

    <SkeletonList v-if="loading" :rows="3" />
    <AppState v-else-if="loadError" variant="error" :title="loadError" retry @retry="load" />

    <template v-else-if="application">
      <AppSection title="مشخصات اعلام‌شده">
        <dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-xs text-muted">نام حقوقی</dt>
            <dd class="font-medium text-highlighted">{{ application.legalName || '—' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted">کد ملی</dt>
            <dd class="font-medium text-highlighted"><span v-if="application.nationalId" class="num">{{ application.nationalId }}</span><span v-else>—</span></dd>
          </div>
          <div>
            <dt class="text-xs text-muted">شهر</dt>
            <dd class="font-medium text-highlighted">{{ application.city || '—' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted">ارسال‌شده</dt>
            <dd class="font-medium text-highlighted">{{ application.submittedAt ? formatDateTime(application.submittedAt) : '—' }}</dd>
          </div>
        </dl>
        <p v-if="application.notes" class="mt-4 rounded-lg bg-canvas-deep p-3 text-sm leading-7 text-default">{{ application.notes }}</p>
        <p v-if="application.reviewNote" class="mt-3 text-sm text-muted">یادداشت قبلی مدیر: {{ application.reviewNote }}</p>
      </AppSection>

      <AppSection title="مدارک" class="mt-6">
        <p v-if="!application.documents.length" class="text-sm text-muted">مدرکی بارگذاری نشده.</p>
        <ul v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <li v-for="doc in application.documents" :key="doc.id">
            <button type="button" class="block w-full overflow-hidden rounded-lg ring-1 ring-default focus-visible:ring-2 focus-visible:ring-primary" aria-label="نمایش بزرگ مدرک" @click="preview = doc.imageUrl">
              <img :src="doc.imageUrl" alt="" class="aspect-[4/3] w-full object-cover" loading="lazy">
              <span class="block bg-canvas px-2 py-1.5 text-start text-xs font-medium text-default">{{ VERIFICATION_DOCUMENT_LABELS[doc.kind] }}</span>
            </button>
          </li>
        </ul>
      </AppSection>

      <AppSection v-if="reviewable" title="تصمیم" description="یادداشت برای ارائه‌دهنده نمایش داده می‌شود؛ برای رد یا درخواست اصلاح حتماً بنویسید." class="mt-6">
        <UFormField label="یادداشت برای ارائه‌دهنده" name="note">
          <UTextarea v-model="note" class="w-full" :rows="3" />
        </UFormField>
        <InlineMessage :message="error" class="mt-3" />
        <div class="mt-4 flex flex-wrap gap-2">
          <UButton icon="i-lucide-badge-check" :loading="pending === 'approve'" :disabled="Boolean(pending)" @click="act('approve')">تأیید</UButton>
          <UButton color="warning" variant="soft" icon="i-lucide-pencil-line" :loading="pending === 'request-changes'" :disabled="Boolean(pending)" @click="act('request-changes')">اصلاح بخواه</UButton>
          <UButton color="error" variant="outline" icon="i-lucide-shield-x" :loading="pending === 'reject'" :disabled="Boolean(pending)" @click="act('reject')">رد</UButton>
        </div>
      </AppSection>

      <UModal v-model:open="previewOpen" title="مدرک" :ui="{ content: 'sm:max-w-3xl bg-ink-950' }">
        <template #content>
          <div class="relative">
            <img v-if="preview" :src="preview" alt="" class="max-h-[85dvh] w-full object-contain">
            <UButton color="neutral" variant="solid" icon="i-lucide-x" size="md" square class="absolute end-3 top-3" aria-label="بستن" @click="preview = null" />
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
