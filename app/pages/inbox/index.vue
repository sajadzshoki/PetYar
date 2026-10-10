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

useHead({ title: 'پیام‌ها | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="پیام‌ها" description="گفتگو با ارائه‌دهنده‌ها و صاحبان حیوان. اطلاعات مهم رزرو را همین‌جا هماهنگ کنید." />

    <SkeletonList v-if="loading" :rows="4" avatar />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />
    <AppState
      v-else-if="!items.length"
      icon="i-lucide-message-circle"
      title="هنوز گفتگویی ندارید"
      description="از صفحه هر ارائه‌دهنده می‌توانید گفتگو را شروع کنید."
    >
      <UButton to="/providers" icon="i-lucide-search" variant="soft">جستجوی ارائه‌دهنده</UButton>
    </AppState>

    <ul v-else class="surface divide-y divide-muted">
      <li v-for="item in items" :key="item.id">
        <NuxtLink :to="`/inbox/${item.id}`" class="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-canvas">
          <MediaThumb :initial="initialOf(item.title)" :alt="item.title" size-class="size-12" rounded="full" />
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline justify-between gap-2">
              <p class="truncate text-base font-bold text-highlighted" :class="!item.unreadCount && 'font-semibold'">{{ item.title }}</p>
              <time v-if="item.lastMessageAt" class="shrink-0 text-xs text-dimmed" :datetime="item.lastMessageAt">{{ formatRelative(item.lastMessageAt) }}</time>
            </div>
            <p class="mt-0.5 truncate text-sm" :class="item.unreadCount ? 'font-medium text-default' : 'text-muted'">
              {{ item.lastMessagePreview || 'بدون پیام' }}
            </p>
          </div>
          <span
            v-if="item.unreadCount"
            class="num flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-inverted"
            :aria-label="`${formatNumber(item.unreadCount)} پیام خوانده‌نشده`"
          >
            {{ formatNumber(item.unreadCount) }}
          </span>
          <UIcon v-else name="i-lucide-chevron-left" class="size-4 shrink-0 text-ink-300" aria-hidden="true" />
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
