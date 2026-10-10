<script setup lang="ts">
import type { StatusMeta } from '~/utils/navigation'

/**
 * Status chip with icon + label (never colour alone).
 */
withDefaults(defineProps<{
  label: string
  meta: StatusMeta
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md',
})
</script>

<template>
  <UBadge :color="meta.color" variant="subtle" :size="size" :icon="meta.icon" class="rounded-full">
    {{ label }}
  </UBadge>
</template>
