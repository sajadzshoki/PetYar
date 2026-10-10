<script setup lang="ts">
/**
 * Real rating only: renders nothing fabricated when there are no reviews.
 */
withDefaults(defineProps<{
  average: number | null | undefined
  count: number
  /** Text when there are no reviews yet; pass empty string to render nothing. */
  emptyLabel?: string
  size?: 'sm' | 'md'
}>(), {
  emptyLabel: 'بدون نظر',
  size: 'sm',
})
</script>

<template>
  <span
    v-if="count > 0 && average != null"
    class="inline-flex items-center gap-1 font-medium text-highlighted"
    :class="size === 'sm' ? 'text-sm' : 'text-base'"
  >
    <UIcon name="i-lucide-star" class="size-4 fill-terracotta-400 text-terracotta-400" aria-hidden="true" />
    <span class="num">{{ formatRating(average) }}</span>
    <span class="font-normal text-muted">({{ formatNumber(count) }} نظر)</span>
  </span>
  <span v-else-if="emptyLabel" class="text-sm text-muted">{{ emptyLabel }}</span>
</template>
