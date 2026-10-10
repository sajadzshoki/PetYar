<script setup lang="ts">
import type { NavItem } from '~/utils/navigation'

/**
 * Admin navigation: `sidebar` on large screens, scrollable `strip` on small screens.
 * The layout decides which variant to render at which breakpoint.
 */
defineProps<{ variant: 'sidebar' | 'strip' }>()

const route = useRoute()

function active(item: NavItem) {
  return isNavActive(route.path, item)
}
</script>

<template>
  <aside v-if="variant === 'sidebar'" class="w-56 shrink-0" aria-label="بخش‌های مدیریت">
    <nav class="sticky top-[calc(var(--spacing-header-lg)+1.5rem)] space-y-1">
      <NuxtLink
        v-for="link in ADMIN_LINKS"
        :key="link.to"
        :to="link.to"
        class="flex min-h-touch items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors"
        :class="active(link) ? 'bg-forest-50 text-primary' : 'text-toned hover:bg-canvas-deep hover:text-highlighted'"
        :aria-current="active(link) ? 'page' : undefined"
      >
        <UIcon :name="link.icon" class="size-4.5" aria-hidden="true" />
        {{ link.label }}
      </NuxtLink>
    </nav>
  </aside>

  <nav v-else class="border-b border-default bg-paper" aria-label="بخش‌های مدیریت">
    <div class="mx-auto flex max-w-page gap-2 overflow-x-auto px-4 py-2.5 scrollbar-none sm:px-6">
      <NuxtLink
        v-for="link in ADMIN_LINKS"
        :key="link.to"
        :to="link.to"
        class="flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors"
        :class="active(link) ? 'border-primary bg-forest-50 text-primary' : 'border-default bg-paper text-toned hover:border-accented'"
        :aria-current="active(link) ? 'page' : undefined"
      >
        <UIcon :name="link.icon" class="size-4" aria-hidden="true" />
        {{ link.label }}
      </NuxtLink>
    </div>
  </nav>
</template>
