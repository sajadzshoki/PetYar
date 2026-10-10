<script setup lang="ts">
import { VERIFICATION_STATUS_LABELS, type VerificationStatus } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

interface Row {
  id: string
  displayName: string
  email: string
  city: string | null
  isActive: boolean
  verificationStatus: VerificationStatus
}

const providers = ref<Row[]>([])
const error = ref('')

onMounted(async () => {
  try {
    const res = await $fetch<{ data: { providers: Row[] } }>('/api/admin/providers')
    providers.value = res.data.providers
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'خطا')
  }
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-semibold">ارائه‌دهندگان</h1>
    <p v-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
    <ul class="mt-6 divide-y divide-ink-100 text-sm">
      <li v-for="p in providers" :key="p.id" class="py-3">
        <NuxtLink :to="`/admin/providers/${p.id}`" class="flex justify-between gap-3">
          <span>{{ p.displayName }} · {{ p.email }}</span>
          <span class="text-ink-500">{{ p.isActive ? 'نمایش عمومی' : 'پنهان' }} · {{ VERIFICATION_STATUS_LABELS[p.verificationStatus] }}</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
