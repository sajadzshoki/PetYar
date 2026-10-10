<script setup lang="ts">
/**
 * Inline feedback for forms and actions (error / success / info).
 * Uses role="alert" for errors so screen readers announce them.
 */
withDefaults(defineProps<{
  message: string
  kind?: 'error' | 'success' | 'info' | 'warning'
}>(), {
  kind: 'error',
})

const icons = {
  error: 'i-lucide-circle-alert',
  success: 'i-lucide-circle-check',
  info: 'i-lucide-info',
  warning: 'i-lucide-triangle-alert',
}

const colors = {
  error: 'error',
  success: 'success',
  info: 'info',
  warning: 'warning',
} as const
</script>

<template>
  <UAlert
    v-if="message"
    :color="colors[kind]"
    variant="subtle"
    :icon="icons[kind]"
    :description="message"
    :role="kind === 'error' ? 'alert' : 'status'"
    class="text-sm"
  />
</template>
