<script setup lang="ts">
withDefaults(defineProps<{
  /** Pixel size of the emblem. */
  size?: number
  /** Show the Persian wordmark next to the emblem. */
  wordmark?: boolean
  to?: string | null
}>(), {
  size: 36,
  wordmark: true,
  to: '/',
})

const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <component
    :is="to ? NuxtLink : 'span'"
    :to="to || undefined"
    class="inline-flex shrink-0 items-center gap-2.5 rounded-md"
    :aria-label="to ? 'پت‌یار — صفحه اصلی' : undefined"
  >
    <img
      src="/brand/petyar-mark.png"
      alt=""
      :width="size"
      :height="size"
      class="shrink-0 select-none"
      :style="{ width: `${size}px`, height: `${size}px` }"
      decoding="async"
    >
    <span v-if="wordmark" class="text-lg font-bold leading-none text-highlighted">پت‌یار</span>
  </component>
</template>
