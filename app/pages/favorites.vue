<script setup lang="ts">
import type { FavoriteProvider } from '~~/shared/types/review'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const items = ref<FavoriteProvider[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { favorites: FavoriteProvider[] } }>('/api/favorites')
    items.value = res.data.favorites
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری ذخیره‌ها ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

async function remove(id: string) {
  await $fetch(`/api/favorites/${id}`, { method: 'DELETE' })
  items.value = items.value.filter(i => i.providerId !== id)
}
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-12">
    <h1 class="text-2xl font-semibold">ذخیره‌شده‌ها</h1>
    <p class="mt-2 text-sm leading-7 text-ink-600">فقط ارائه‌دهندگانی که خودتان ذخیره کرده‌اید.</p>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <AppState v-else-if="error" :title="error" />
    <p v-else-if="!items.length" class="mt-10 text-sm text-ink-500">هنوز کسی را ذخیره نکرده‌اید.</p>
    <ul v-else class="mt-8 divide-y divide-ink-100">
      <li v-for="item in items" :key="item.providerId" class="flex items-center justify-between gap-3 py-4">
        <NuxtLink :to="`/providers/${item.providerId}`" class="min-w-0">
          <p class="font-medium">{{ item.displayName }}</p>
          <p class="mt-1 text-sm text-ink-600">{{ item.city || 'شهر اعلام نشده' }}</p>
          <p v-if="item.reviewCount" class="mt-1 text-sm text-ink-700">{{ item.ratingAverage }} از ۵ · {{ item.reviewCount }} نظر</p>
        </NuxtLink>
        <button type="button" class="shrink-0 text-sm text-ink-500" @click="remove(item.providerId)">حذف</button>
      </li>
    </ul>
  </div>
</template>
