<script setup lang="ts">
/**
 * Image with a graceful fallback (icon or initial) that never breaks layout.
 */
withDefaults(defineProps<{
  src?: string | null
  alt?: string
  /** Fallback initial (e.g. first letter of a name). Takes precedence over icon when set. */
  initial?: string
  icon?: string
  /** Tailwind size classes, e.g. `size-16`. */
  sizeClass?: string
  rounded?: 'md' | 'lg' | 'xl' | 'full'
}>(), {
  src: null,
  alt: '',
  initial: '',
  icon: 'i-lucide-paw-print',
  sizeClass: 'size-16',
  rounded: 'xl',
})

const roundedClass = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
}
</script>

<template>
  <div
    class="relative shrink-0 overflow-hidden bg-canvas-deep ring-1 ring-default"
    :class="[sizeClass, roundedClass[rounded]]"
  >
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      class="size-full object-cover"
      loading="lazy"
      decoding="async"
    >
    <span
      v-else-if="initial"
      class="flex size-full items-center justify-center text-lg font-bold text-ink-500"
      aria-hidden="true"
    >
      {{ initial }}
    </span>
    <span v-else class="flex size-full items-center justify-center text-ink-400" aria-hidden="true">
      <UIcon :name="icon" class="size-[40%]" />
    </span>
  </div>
</template>
