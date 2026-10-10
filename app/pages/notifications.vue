<script setup lang="ts">
import type { AppNotification } from '~~/shared/types/notification'
import type { NotificationType } from '~~/shared/constants/notifications'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const unread = useUnreadNotifications()
const items = ref<AppNotification[]>([])
const loading = ref(true)
const error = ref('')
const readingAll = ref(false)

const TYPE_ICONS: Record<NotificationType, string> = {
  BOOKING_REQUEST: 'i-lucide-calendar-plus',
  BOOKING_ACCEPTED: 'i-lucide-calendar-check',
  BOOKING_REJECTED: 'i-lucide-calendar-x',
  BOOKING_CANCELLED: 'i-lucide-calendar-x',
  PAYMENT_RESULT: 'i-lucide-credit-card',
  NEW_MESSAGE: 'i-lucide-message-circle',
  REVIEW_AVAILABLE: 'i-lucide-star',
  VERIFICATION_UPDATE: 'i-lucide-badge-check',
  ACCOUNT_STATUS: 'i-lucide-user',
  DISPUTE_UPDATE: 'i-lucide-shield-alert',
  REPORT_UPDATE: 'i-lucide-flag',
}

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
    unread.decrement()
  }
  if (item.href) await navigateTo(item.href)
}

async function readAll() {
  readingAll.value = true
  try {
    await unread.markAllRead()
    await load()
  }
  finally {
    readingAll.value = false
  }
}

const hasUnread = computed(() => items.value.some(i => !i.readAt))

useHead({ title: 'اعلان‌ها | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="اعلان‌ها" description="تغییر وضعیت رزروها، پرداخت‌ها و پیام‌های جدید.">
      <template #actions>
        <UButton v-if="hasUnread" color="neutral" variant="ghost" size="md" icon="i-lucide-check-check" :loading="readingAll" @click="readAll">
          همه خوانده شود
        </UButton>
      </template>
    </PageHeader>

    <SkeletonList v-if="loading" :rows="4" avatar />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />
    <AppState v-else-if="!items.length" icon="i-lucide-bell" title="اعلانی نیست" description="وقتی اتفاقی در رزروها یا پیام‌ها بیفتد، اینجا خبر می‌دهیم." />

    <ul v-else class="surface divide-y divide-muted">
      <li v-for="item in items" :key="item.id">
        <button
          type="button"
          class="flex w-full items-start gap-3 px-4 py-3.5 text-start transition-colors hover:bg-canvas"
          :class="!item.readAt && 'bg-forest-50/60'"
          @click="openItem(item)"
        >
          <span
            class="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full"
            :class="item.readAt ? 'bg-canvas-deep text-muted' : 'bg-forest-100 text-primary dark:bg-forest-50'"
            aria-hidden="true"
          >
            <UIcon :name="TYPE_ICONS[item.type] || 'i-lucide-bell'" class="size-5" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-start justify-between gap-2">
              <span class="text-sm font-bold" :class="item.readAt ? 'text-default' : 'text-highlighted'">
                {{ item.title }}
                <span v-if="!item.readAt" class="sr-only">(خوانده‌نشده)</span>
              </span>
              <span v-if="!item.readAt" class="mt-1.5 size-2 shrink-0 rounded-full bg-terracotta-500" aria-hidden="true" />
            </span>
            <span class="mt-0.5 block text-sm leading-7 text-muted">{{ item.body }}</span>
            <time class="mt-1 block text-xs text-dimmed" :datetime="item.createdAt">{{ formatRelative(item.createdAt) }}</time>
          </span>
          <UIcon v-if="item.href" name="i-lucide-chevron-left" class="mt-3 size-4 shrink-0 text-ink-300" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </div>
</template>
