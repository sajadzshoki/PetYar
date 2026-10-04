<script setup lang="ts">
import type { AppNotification } from '~~/shared/types/notification'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const items = ref<AppNotification[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { notifications: AppNotification[] } }>('/api/notifications')
    items.value = res.data.notifications
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری اعلان‌ها ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

async function openItem(item: AppNotification) {
  if (!item.readAt) {
    await $fetch(`/api/notifications/${item.id}/read`, { method: 'POST' }).catch(() => {})
    item.readAt = new Date().toISOString()
  }
  if (item.href) await navigateTo(item.href)
}

async function readAll() {
  await $fetch('/api/notifications/read-all', { method: 'POST' })
  await load()
}

function when(iso: string) {
  return new Date(iso).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })
}
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-10">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold">اعلان‌ها</h1>
      <button v-if="items.some(i => !i.readAt)" type="button" class="text-sm text-ink-600" @click="readAll">همه خوانده شود</button>
    </div>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <AppState v-else-if="error" :title="error" />
    <p v-else-if="!items.length" class="mt-10 text-sm text-ink-500">اعلانی نیست.</p>
    <ul v-else class="mt-8 divide-y divide-ink-100">
      <li v-for="item in items" :key="item.id">
        <button type="button" class="w-full py-4 text-right" @click="openItem(item)">
          <p class="font-medium" :class="item.readAt ? 'text-ink-700' : 'text-ink-900'">{{ item.title }}</p>
          <p class="mt-1 text-sm leading-7 text-ink-600">{{ item.body }}</p>
          <p class="mt-1 text-xs text-ink-400">{{ when(item.createdAt) }}</p>
        </button>
      </li>
    </ul>
  </div>
</template>
