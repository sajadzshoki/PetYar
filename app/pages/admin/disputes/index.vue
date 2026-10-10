<script setup lang="ts">
import type { BookingDispute } from '~~/shared/types/moderation'
import { DISPUTE_STATUS_LABELS } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const disputes = ref<BookingDispute[]>([])
const error = ref('')

onMounted(async () => {
  try {
    const res = await $fetch<{ data: { disputes: BookingDispute[] } }>('/api/admin/disputes')
    disputes.value = res.data.disputes
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'خطا')
  }
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-semibold">اختلاف‌ها</h1>
    <p v-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
    <ul class="mt-6 divide-y divide-ink-100 text-sm">
      <li v-for="d in disputes" :key="d.id" class="py-3">
        <NuxtLink :to="`/admin/disputes/${d.id}`" class="flex justify-between gap-3">
          <span>{{ d.openerName }}</span>
          <span class="text-ink-500">{{ DISPUTE_STATUS_LABELS[d.status] }}</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
