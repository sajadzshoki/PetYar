<script setup lang="ts">
import type { ProviderRatingSummary, Review } from '~~/shared/types/review'
import { REVIEW_DIMENSION_LABELS } from '~~/shared/constants/reviews'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const summary = ref<ProviderRatingSummary | null>(null)
const reviews = ref<Review[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
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

const dimensions = computed(() => {
  if (!summary.value?.reviewCount) return []
  const s = summary.value
  return [
    { label: REVIEW_DIMENSION_LABELS.communication, value: s.communication },
    { label: REVIEW_DIMENSION_LABELS.quality, value: s.quality },
    { label: REVIEW_DIMENSION_LABELS.punctuality, value: s.punctuality },
    { label: REVIEW_DIMENSION_LABELS.care, value: s.care },
  ]
})

useHead({ title: 'نظر مشتریان | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="نظر مشتریان" description="نظرها فقط پس از رزرو تمام‌شده ثبت می‌شوند و قابل ویرایش نیستند." />

    <SkeletonList v-if="loading" :rows="3" />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />
    <AppState
      v-else-if="!summary?.reviewCount"
      icon="i-lucide-star"
      title="هنوز نظری ثبت نشده"
      description="پس از اولین رزرو تمام‌شده، صاحب حیوان می‌تواند به شما امتیاز بدهد."
    />

    <template v-else>
      <AppSection>
        <div class="flex flex-wrap items-center gap-5">
          <div class="flex items-baseline gap-1">
            <span class="num text-5xl font-extrabold text-highlighted">{{ formatRating(summary.overall) }}</span>
            <span class="text-sm text-muted">از ۵</span>
          </div>
          <div class="min-w-0 flex-1">
            <RatingSummary :average="summary.overall" :count="summary.reviewCount" size="md" />
            <dl class="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-4">
              <div v-for="dim in dimensions" :key="dim.label" class="flex items-center justify-between gap-2">
                <dt class="text-muted">{{ dim.label }}</dt>
                <dd class="num font-semibold text-highlighted">{{ formatRating(dim.value) }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </AppSection>

      <ul class="mt-6 grid gap-3">
        <li v-for="item in reviews" :key="item.id" class="surface p-4">
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
          </div>
          <p class="mt-3 text-sm leading-7 text-default">{{ item.comment }}</p>
          <UBadge v-if="item.hidden" color="neutral" variant="subtle" size="sm" class="mt-2 rounded-full" icon="i-lucide-eye-off">پنهان‌شده توسط مدیریت</UBadge>
        </li>
      </ul>
    </template>
  </div>
</template>
