<script setup lang="ts">
import type { ProviderSearchHit } from '~~/shared/types/search'

const props = defineProps<{ item: ProviderSearchHit }>()

const location = computed(() =>
  [props.item.city, props.item.district].filter(Boolean).join('، ') || props.item.serviceArea || 'محدوده اعلام نشده',
)
</script>

<template>
  <NuxtLink
    :to="`/providers/${item.id}`"
    class="pressable surface group flex h-full gap-3.5 p-3.5 transition-colors hover:border-forest-300 sm:p-4"
  >
    <MediaThumb
      :src="item.photoUrl"
      :initial="initialOf(item.displayName)"
      size-class="size-20 sm:size-24"
      rounded="xl"
    />
    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-2">
        <h3 class="truncate text-base font-bold text-highlighted">{{ item.displayName }}</h3>
        <UIcon name="i-lucide-chevron-left" class="mt-1 size-4 shrink-0 text-ink-300 transition-colors group-hover:text-ink-500" aria-hidden="true" />
      </div>
      <p class="mt-0.5 flex items-center gap-1 text-sm text-muted">
        <UIcon name="i-lucide-map-pin" class="size-3.5 shrink-0" aria-hidden="true" />
        <span class="truncate">{{ location }}</span>
        <span v-if="item.distanceKm != null" class="shrink-0 text-dimmed">· {{ formatDistance(item.distanceKm) }}</span>
      </p>
      <RatingSummary :average="item.ratingAverage" :count="item.reviewCount" class="mt-1.5" empty-label="هنوز نظری ندارد" />
      <p v-if="item.serviceTitles.length" class="mt-2 line-clamp-1 text-sm text-toned">
        {{ item.serviceTitles.join('، ') }}
      </p>
      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span v-if="item.minPrice != null" class="font-semibold text-highlighted">
          از <span class="num">{{ formatNumber(item.minPrice) }}</span> تومان
        </span>
        <span v-if="item.experienceYears" class="text-muted">
          <span class="num">{{ formatNumber(item.experienceYears) }}</span> سال سابقه
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
