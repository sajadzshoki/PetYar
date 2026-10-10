<script setup lang="ts">
import { VERIFICATION_STATUS_LABELS, type VerificationStatus } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

interface Row {
  id: string
  displayName: string
  email: string
  isActive: boolean
  verificationStatus: VerificationStatus
}

const route = useRoute()
const provider = ref<Row | null>(null)
const reason = ref('')
const error = ref('')
const pending = ref(false)

async function load() {
  const res = await $fetch<{ data: { provider: Row } }>(`/api/admin/providers/${route.params.id}`)
  provider.value = res.data.provider
}

async function act(path: string) {
  if (reason.value.trim().length < 3) return
  pending.value = true
  try {
    const res = await $fetch<{ data: { provider: Row } }>(path, { method: 'POST', body: { reason: reason.value } })
    provider.value = res.data.provider
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
    <NuxtLink to="/admin/providers" class="text-sm text-ink-600">ارائه‌دهندگان</NuxtLink>
    <template v-if="provider">
      <h1 class="mt-3 text-2xl font-semibold">{{ provider.displayName }}</h1>
      <p class="mt-2 text-sm">{{ provider.email }}</p>
      <p class="mt-2 text-sm">{{ provider.isActive ? 'قابل مشاهده' : 'پنهان از جستجو' }} · {{ VERIFICATION_STATUS_LABELS[provider.verificationStatus] }}</p>
      <UTextarea v-model="reason" class="mt-6 w-full" placeholder="دلیل" />
      <p v-if="error" class="mt-2 text-sm text-terracotta-700">{{ error }}</p>
      <div class="mt-4 flex gap-2">
        <UButton :loading="pending" color="neutral" variant="outline" @click="act(`/api/admin/providers/${provider.id}/deactivate`)">پنهان کردن</UButton>
        <UButton :loading="pending" @click="act(`/api/admin/providers/${provider.id}/activate`)">نمایش عمومی</UButton>
      </div>
      <p class="mt-6 text-sm">
        <NuxtLink :to="`/providers/${provider.id}`" class="text-terracotta-700">صفحه عمومی</NuxtLink>
      </p>
    </template>
  </div>
</template>
