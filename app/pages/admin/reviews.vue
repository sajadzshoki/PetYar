<script setup lang="ts">
import type { AdminReview } from '~~/shared/types/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const toast = useToast()
const reviews = ref<AdminReview[]>([])
const reason = ref('')
const error = ref('')
const loadError = ref('')
const loading = ref(true)
const pending = ref('')
const hideTarget = ref<AdminReview | null>(null)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await $fetch<{ data: { reviews: AdminReview[] } }>('/api/admin/reviews')
    reviews.value = res.data.reviews
  }
  catch (err) {
    loadError.value = apiErrorMessage(err, 'بارگذاری ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

async function hide() {
  if (!hideTarget.value || reason.value.trim().length < 3) return
  pending.value = hideTarget.value.id
  error.value = ''
  try {
    await $fetch(`/api/admin/reviews/${hideTarget.value.id}/hide`, { method: 'POST', body: { reason: reason.value } })
    toast.add({ title: 'نظر پنهان شد', icon: 'i-lucide-eye-off', color: 'success' })
    hideTarget.value = null
    reason.value = ''
    await load()
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'انجام نشد')
  }
  finally {
    pending.value = ''
  }
}

async function restore(id: string) {
  pending.value = id
  try {
    await $fetch(`/api/admin/reviews/${id}/restore`, { method: 'POST' })
    toast.add({ title: 'نظر دوباره نمایش داده می‌شود', icon: 'i-lucide-eye', color: 'success' })
    await load()
  }
  catch (err) {
    toast.add({ title: apiErrorMessage(err, 'انجام نشد'), color: 'error', icon: 'i-lucide-circle-alert' })
  }
  finally {
    pending.value = ''
  }
}

onMounted(load)

useHead({ title: 'نظارت بر نظرها | مدیریت پت‌یار' })
</script>

<template>
  <div class="max-w-content">
    <PageHeader title="نظارت بر نظرها" description="نظر پنهان‌شده از صفحه عمومی حذف می‌شود اما در میانگین باقی می‌ماند." compact />

    <SkeletonList v-if="loading" :rows="4" avatar />
    <AppState v-else-if="loadError" variant="error" :title="loadError" retry @retry="load" />
    <AppState v-else-if="!reviews.length" icon="i-lucide-star" title="نظری ثبت نشده" compact />
    <ul v-else class="grid gap-3">
      <li v-for="item in reviews" :key="item.id" class="surface p-4" :class="item.hidden && 'opacity-80'">
        <div class="flex items-center gap-3">
          <MediaThumb :initial="initialOf(item.ownerName)" :alt="item.ownerName" size-class="size-10" rounded="full" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-highlighted">{{ item.ownerName }}</p>
            <p class="text-xs text-dimmed">{{ formatDate(item.createdAt) }}</p>
          </div>
          <span class="inline-flex items-center gap-1 text-sm font-semibold">
            <UIcon name="i-lucide-star" class="size-4 fill-terracotta-400 text-terracotta-400 dark:fill-terracotta-300 dark:text-terracotta-300" aria-hidden="true" />
            <span class="num">{{ formatRating(item.overall) }}</span>
          </span>
          <UBadge v-if="item.hidden" color="neutral" variant="subtle" size="sm" class="rounded-full" icon="i-lucide-eye-off">پنهان</UBadge>
        </div>
        <p class="mt-3 text-sm leading-7 text-default">{{ item.comment }}</p>
        <div class="mt-3 flex flex-wrap items-center gap-2 border-t border-muted pt-3">
          <UButton :to="`/admin/providers/${item.providerId}`" size="sm" color="neutral" variant="ghost" icon="i-lucide-store">ارائه‌دهنده</UButton>
          <UButton :to="`/admin/bookings/${item.bookingId}`" size="sm" color="neutral" variant="ghost" icon="i-lucide-calendar">رزرو</UButton>
          <UButton v-if="!item.hidden" size="sm" color="error" variant="soft" icon="i-lucide-eye-off" class="ms-auto" :disabled="pending === item.id" @click="hideTarget = item">پنهان</UButton>
          <UButton v-else size="sm" variant="soft" icon="i-lucide-eye" class="ms-auto" :loading="pending === item.id" @click="restore(item.id)">نمایش مجدد</UButton>
        </div>
      </li>
    </ul>

    <UModal :open="Boolean(hideTarget)" title="پنهان کردن نظر" description="دلیل در دفتر ممیزی ثبت می‌شود." @update:open="(v: boolean) => { if (!v) hideTarget = null }">
      <template #body>
        <p v-if="hideTarget" class="mb-4 rounded-lg bg-canvas-deep p-3 text-sm leading-7 text-default">{{ hideTarget.comment }}</p>
        <UFormField label="دلیل پنهان‌سازی" name="reason" required help="حداقل ۳ کاراکتر">
          <UTextarea v-model="reason" class="w-full" :rows="3" autofocus />
        </UFormField>
        <InlineMessage :message="error" class="mt-3" />
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" size="md" @click="hideTarget = null">انصراف</UButton>
          <UButton color="error" size="md" icon="i-lucide-eye-off" :loading="Boolean(hideTarget && pending === hideTarget.id)" :disabled="reason.trim().length < 3" @click="hide">پنهان کردن</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
