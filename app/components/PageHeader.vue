<script setup lang="ts">
/**
 * Consistent page hierarchy: optional back link, eyebrow, title, description, actions.
 */
withDefaults(defineProps<{
  title: string
  eyebrow?: string
  description?: string
  back?: { to: string, label: string } | null
  /** Use a smaller heading for secondary / detail screens. */
  compact?: boolean
}>(), {
  eyebrow: '',
  description: '',
  back: null,
  compact: false,
})
</script>

<template>
  <header class="mb-6">
    <NuxtLink
      v-if="back"
      :to="back.to"
      class="-ms-1 mb-3 inline-flex min-h-touch items-center gap-1.5 rounded-md px-1 text-sm font-medium text-muted transition-colors hover:text-highlighted"
    >
      <UIcon name="i-lucide-arrow-right" class="size-4" />
      <span>{{ back.label }}</span>
    </NuxtLink>
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p v-if="eyebrow" class="mb-1 text-sm font-semibold text-primary">{{ eyebrow }}</p>
        <h1 class="text-highlighted" :class="compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'">
          {{ title }}
        </h1>
        <p v-if="description" class="mt-2 max-w-prose text-sm leading-7 text-muted sm:text-[15px]">
          {{ description }}
        </p>
        <slot name="meta" />
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
