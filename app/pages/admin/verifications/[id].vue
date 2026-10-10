<script setup lang="ts">
import type { VerificationApplication } from '~~/shared/types/moderation'
import { VERIFICATION_DOCUMENT_LABELS, VERIFICATION_STATUS_LABELS } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const route = useRoute()
const application = ref<VerificationApplication | null>(null)
const note = ref('')
const error = ref('')
const pending = ref(false)

async function load() {
  const res = await $fetch<{ data: { application: VerificationApplication } }>(`/api/admin/verifications/${route.params.id}`)
  application.value = res.data.application
}

async function act(path: string) {
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { application: VerificationApplication } }>(path, { method: 'POST', body: { note: note.value } })
    application.value = res.data.application
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
    <NuxtLink to="/admin/verifications" class="text-sm text-ink-600">احراز</NuxtLink>
    <template v-if="application">
      <h1 class="mt-3 text-2xl font-semibold">{{ application.providerName }}</h1>
      <p class="mt-2 text-sm">{{ VERIFICATION_STATUS_LABELS[application.status] }}</p>
      <dl class="mt-6 space-y-2 text-sm">
        <div class="flex justify-between gap-4"><dt>نام حقوقی</dt><dd>{{ application.legalName }}</dd></div>
        <div class="flex justify-between gap-4"><dt>کد ملی</dt><dd dir="ltr">{{ application.nationalId }}</dd></div>
        <div v-if="application.city" class="flex justify-between gap-4"><dt>شهر</dt><dd>{{ application.city }}</dd></div>
      </dl>
      <p v-if="application.notes" class="mt-4 text-sm leading-7">{{ application.notes }}</p>
      <div class="mt-6 grid grid-cols-2 gap-2">
        <a v-for="doc in application.documents" :key="doc.id" :href="doc.imageUrl" target="_blank" class="block">
          <img :src="doc.imageUrl" alt="" class="h-28 w-full object-cover ring-1 ring-ink-200">
          <p class="mt-1 text-xs">{{ VERIFICATION_DOCUMENT_LABELS[doc.kind] }}</p>
        </a>
      </div>
      <UTextarea v-model="note" class="mt-6 w-full" placeholder="یادداشت برای ارائه‌دهنده" />
      <p v-if="error" class="mt-2 text-sm text-terracotta-700">{{ error }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <UButton :loading="pending" @click="act(`/api/admin/verifications/${application.id}/approve`)">تأیید</UButton>
        <UButton :loading="pending" color="neutral" variant="outline" @click="act(`/api/admin/verifications/${application.id}/request-changes`)">اصلاح بخواه</UButton>
        <UButton :loading="pending" color="neutral" variant="ghost" @click="act(`/api/admin/verifications/${application.id}/reject`)">رد</UButton>
      </div>
    </template>
  </div>
</template>
