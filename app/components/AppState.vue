<script setup lang="ts">
/**
 * Loading / empty / error state. Status is never conveyed by colour alone —
 * each variant has its own icon and copy.
 */
const props = withDefaults(defineProps<{
  title: string
  description?: string
  variant?: 'loading' | 'empty' | 'error'
  icon?: string
  /** Show a retry button that emits `retry`. */
  retry?: boolean
  compact?: boolean
}>(), {
  description: '',
  variant: 'empty',
  icon: '',
  retry: false,
  compact: false,
})

const emit = defineEmits<{ retry: [] }>()

const resolvedIcon = computed(() => {
  if (props.icon) return props.icon
  if (props.variant === 'error') return 'i-lucide-circle-alert'
  if (props.variant === 'loading') return 'i-lucide-loader'
  return 'i-lucide-inbox'
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center text-center"
    :class="compact ? 'px-4 py-8' : 'px-6 py-14'"
    :role="variant === 'error' ? 'alert' : 'status'"
    :aria-busy="variant === 'loading' ? 'true' : undefined"
  >
    <span
      class="flex size-12 items-center justify-center rounded-full"
      :class="{
        'bg-canvas-deep text-muted': variant === 'empty',
        'bg-red-50 text-red-700 dark:text-red-300': variant === 'error',
        'bg-forest-50 text-primary': variant === 'loading',
      }"
    >
      <UIcon :name="resolvedIcon" class="size-6" :class="variant === 'loading' && 'animate-spin motion-reduce:animate-none'" />
    </span>
    <p class="mt-4 text-base font-semibold text-highlighted">{{ title }}</p>
    <p v-if="description" class="mt-1.5 max-w-sm text-sm leading-7 text-muted">{{ description }}</p>
    <div v-if="$slots.default || retry" class="mt-5 flex flex-wrap items-center justify-center gap-2">
      <UButton v-if="retry" color="neutral" variant="outline" size="md" icon="i-lucide-refresh-cw" @click="emit('retry')">
        تلاش دوباره
      </UButton>
      <slot />
    </div>
  </div>
</template>
