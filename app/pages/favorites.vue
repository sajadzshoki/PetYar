<script setup lang="ts">
import type { FavoriteProvider } from '~~/shared/types/review'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const toast = useToast()
const items = ref<FavoriteProvider[]>([])
const loading = ref(true)
const error = ref('')
const removing = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { favorites: FavoriteProvider[] } }>('/api/favorites')
    items.value = res.data.favorites
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری ذخیره‌شده‌ها ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

async function remove(id: string) {
  removing.value = id
  try {
    await $fetch(`/api/favorites/${id}`, { method: 'DELETE' })
    items.value = items.value.filter(i => i.providerId !== id)
    toast.add({ title: 'از ذخیره‌شده‌ها حذف شد', icon: 'i-lucide-heart-off', color: 'neutral' })
  }
  catch (err) {
    toast.add({ title: apiErrorMessage(err, 'حذف نشد'), color: 'error', icon: 'i-lucide-circle-alert' })
  }
  finally {
    removing.value = null
  }
}

useHead({ title: 'ذخیره‌شده‌ها | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="ذخیره‌شده‌ها" description="ارائه‌دهنده‌هایی که برای بعد نشان کرده‌اید." />

    <SkeletonList v-if="loading" :rows="3" avatar />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />
    <AppState
      v-else-if="!items.length"
      icon="i-lucide-heart"
      title="هنوز کسی را ذخیره نکرده‌اید"
      description="روی صفحه هر ارائه‌دهنده دکمه «ذخیره» را بزنید تا اینجا نمایش داده شود."
    >
      <UButton to="/providers" icon="i-lucide-search" variant="soft">جستجوی ارائه‌دهنده</UButton>
    </AppState>

    <ul v-else class="surface divide-y divide-muted">
      <li v-for="item in items" :key="item.providerId" class="flex items-center gap-3 px-4 py-3.5">
        <NuxtLink :to="`/providers/${item.providerId}`" class="flex min-w-0 flex-1 items-center gap-3">
          <MediaThumb :src="item.photoUrl" :alt="item.displayName" :initial="initialOf(item.displayName)" size-class="size-14" rounded="lg" />
          <div class="min-w-0">
            <p class="truncate text-base font-bold text-highlighted">{{ item.displayName }}</p>
            <p class="mt-0.5 truncate text-sm text-muted">{{ item.city || 'شهر اعلام نشده' }}</p>
            <RatingSummary :average="item.ratingAverage" :count="item.reviewCount" class="mt-1" />
          </div>
        </NuxtLink>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-heart-off"
          square
          size="md"
          :loading="removing === item.providerId"
          :aria-label="`حذف ${item.displayName} از ذخیره‌شده‌ها`"
          @click="remove(item.providerId)"
        />
      </li>
    </ul>
  </div>
</template>
