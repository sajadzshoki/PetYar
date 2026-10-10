<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
    <p class="text-base font-medium text-ink-900">{{ title }}</p>
    <p v-if="description" class="mt-2 max-w-sm text-sm leading-6 text-ink-600">{{ description }}</p>
    <div v-if="$slots.default" class="mt-5">
      <slot />
    </div>
  </div>
</template>
