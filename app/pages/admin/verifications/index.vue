<script setup lang="ts">
import type { VerificationApplication } from '~~/shared/types/moderation'
import { VERIFICATION_STATUS_LABELS } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const applications = ref<VerificationApplication[]>([])
const error = ref('')

onMounted(async () => {
  try {
    const res = await $fetch<{ data: { applications: VerificationApplication[] } }>('/api/admin/verifications')
    applications.value = res.data.applications
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'خطا')
  }
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-semibold">احراز هویت</h1>
    <p v-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
    <ul class="mt-6 divide-y divide-ink-100 text-sm">
      <li v-for="item in applications" :key="item.id" class="py-3">
        <NuxtLink :to="`/admin/verifications/${item.id}`" class="flex justify-between gap-3">
          <span>{{ item.providerName }} · {{ item.legalName }}</span>
          <span class="text-ink-500">{{ VERIFICATION_STATUS_LABELS[item.status] }}</span>
        </NuxtLink>
      </li>
    </ul>
    <p v-if="!applications.length && !error" class="mt-6 text-sm text-ink-500">درخواستی نیست.</p>
  </div>
</template>
