<script setup lang="ts">
/**
 * Titled surface used to group content on detail / form screens.
 */
withDefaults(defineProps<{
  title?: string
  description?: string
  /** Remove inner padding so lists can run edge-to-edge inside the surface. */
  flush?: boolean
  as?: string
}>(), {
  title: '',
  description: '',
  flush: false,
  as: 'section',
})
</script>

<template>
  <component :is="as" class="surface overflow-hidden">
    <div v-if="title || $slots.actions" class="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5" :class="flush && 'pb-3'">
      <div class="min-w-0">
        <h2 v-if="title" class="text-base font-bold text-highlighted sm:text-lg">{{ title }}</h2>
        <p v-if="description" class="mt-1 text-sm leading-6 text-muted">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions" />
      </div>
    </div>
    <div :class="flush ? '' : 'p-4 sm:p-5'">
      <slot />
    </div>
  </component>
</template>
