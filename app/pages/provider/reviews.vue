<script setup lang="ts">
import type { ProviderRatingSummary, Review } from '~~/shared/types/review'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const summary = ref<ProviderRatingSummary | null>(null)
const reviews = ref<Review[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  try {
    const res = await $fetch<{ data: { summary: ProviderRatingSummary, reviews: Review[] } }>('/api/provider/reviews')
    summary.value = res.data.summary
    reviews.value = res.data.reviews
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری نظرها ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-10">
    <h1 class="text-2xl font-semibold">نظر مشتریان</h1>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <p v-else-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
    <template v-else>
      <p v-if="summary?.reviewCount" class="mt-3 text-sm text-ink-700">
        میانگین {{ summary.overall }} از ۵ · {{ summary.reviewCount }} نظر
      </p>
      <p v-else class="mt-3 text-sm text-ink-500">نظری ثبت نشده. امتیازی نمایش داده نمی‌شود.</p>
      <ul class="mt-8 divide-y divide-ink-100">
        <li v-for="item in reviews" :key="item.id" class="py-4">
          <p class="text-sm font-medium">{{ item.ownerName }} · {{ item.overall }} از ۵</p>
          <p class="mt-2 text-sm leading-7 text-ink-700">{{ item.comment }}</p>
        </li>
      </ul>
    </template>
  </div>
</template>
