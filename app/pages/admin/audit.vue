<script setup lang="ts">
import type { AuditLogEntry } from '~~/shared/types/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const logs = ref<AuditLogEntry[]>([])
const error = ref('')

onMounted(async () => {
  try {
    const res = await $fetch<{ data: { logs: AuditLogEntry[] } }>('/api/admin/audit')
    logs.value = res.data.logs
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'خطا')
  }
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-semibold">دفتر ممیزی</h1>
    <p class="mt-2 text-sm text-ink-600">تغییرات مدیریتی و امنیتی ثبت‌شده.</p>
    <p v-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
    <ul class="mt-6 divide-y divide-ink-100 text-sm">
      <li v-for="item in logs" :key="item.id" class="py-3">
        <p>{{ item.actorName }} · {{ item.action }} · {{ item.entityType }}</p>
        <p class="mt-1 text-xs text-ink-400">{{ new Date(item.createdAt).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' }) }}</p>
      </li>
    </ul>
  </div>
</template>
