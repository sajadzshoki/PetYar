<script setup lang="ts">
/**
 * Tappable list row used across lists (bookings, pets, conversations, admin).
 * Renders as a NuxtLink when `to` is set, otherwise as a plain row.
 */
withDefaults(defineProps<{
  to?: string | null
  /** Show trailing chevron for navigable rows. */
  chevron?: boolean
}>(), {
  to: null,
  chevron: true,
})

const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <component
    :is="to ? NuxtLink : 'div'"
    :to="to || undefined"
    class="group flex min-h-touch items-center gap-3 px-4 py-3.5 transition-colors sm:px-5"
    :class="to && 'hover:bg-canvas active:bg-canvas-deep'"
  >
    <slot name="leading" />
    <div class="min-w-0 flex-1">
      <slot />
    </div>
    <slot name="trailing" />
    <UIcon
      v-if="to && chevron"
      name="i-lucide-chevron-left"
      class="size-5 shrink-0 text-ink-300 transition-colors group-hover:text-ink-500"
      aria-hidden="true"
    />
  </component>
</template>
