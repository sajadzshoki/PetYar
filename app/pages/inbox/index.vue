<script setup lang="ts">
import type { Conversation } from '~~/shared/types/messaging'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const items = ref<Conversation[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { conversations: Conversation[] } }>('/api/conversations')
    items.value = res.data.conversations
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری گفتگوها ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

function when(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })
}
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-10">
    <h1 class="text-2xl font-semibold">پیام‌ها</h1>
    <p class="mt-2 text-sm leading-7 text-ink-600">گفتگو با ارائه‌دهنده یا صاحب حیوان. اتصال لحظه‌ای هنوز نیست؛ صفحه را تازه کنید.</p>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <AppState v-else-if="error" :title="error" />
    <p v-else-if="!items.length" class="mt-10 text-sm text-ink-500">هنوز گفتگویی ندارید.</p>
    <ul v-else class="mt-8 divide-y divide-ink-100">
      <li v-for="item in items" :key="item.id">
        <NuxtLink :to="`/inbox/${item.id}`" class="flex items-start justify-between gap-3 py-4">
          <div class="min-w-0">
            <p class="font-medium">{{ item.title }}</p>
            <p class="mt-1 truncate text-sm text-ink-600">{{ item.lastMessagePreview || 'بدون پیام' }}</p>
            <p class="mt-1 text-xs text-ink-400">{{ when(item.lastMessageAt) }}</p>
          </div>
          <span v-if="item.unreadCount" class="mt-1 shrink-0 rounded-full bg-terracotta-500 px-2 py-0.5 text-xs text-white">
            {{ item.unreadCount }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
