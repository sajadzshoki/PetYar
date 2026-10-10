<script setup lang="ts">
import type { NavItem } from '~/utils/navigation'

/**
 * Mobile bottom navigation. Fixed, safe-area aware, hidden on md+ screens.
 * Items are supplied by the layout so each workspace keeps its own structure.
 */
const props = defineProps<{
  items: NavItem[]
  /** Optional badge counts keyed by `to`. */
  badges?: Record<string, number>
}>()

const emit = defineEmits<{ more: [] }>()

const route = useRoute()

function active(item: NavItem) {
  return isNavActive(route.path, item)
}

function badge(item: NavItem) {
  return props.badges?.[item.to] || 0
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-default bg-paper/95 pb-safe shadow-nav backdrop-blur supports-[backdrop-filter]:bg-paper/90 md:hidden"
    aria-label="ناوبری پایین"
  >
    <ul class="mx-auto flex h-bottom-nav max-w-lg items-stretch justify-around px-1">
      <li v-for="item in items" :key="item.to" class="flex min-w-0 flex-1">
        <NuxtLink
          :to="item.to"
          class="pressable relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-semibold leading-none transition-colors"
          :class="active(item) ? 'text-primary' : 'text-ink-500 hover:text-ink-700'"
          :aria-current="active(item) ? 'page' : undefined"
        >
          <span
            class="relative flex h-7 w-12 items-center justify-center rounded-full transition-colors"
            :class="active(item) && 'bg-forest-100 dark:bg-forest-50'"
          >
            <UIcon :name="item.icon" class="size-[22px]" aria-hidden="true" />
            <span
              v-if="badge(item) > 0"
              class="absolute -top-0.5 end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta-500 px-1 text-[10px] font-bold text-white dark:text-inverted"
            >
              {{ badge(item) > 9 ? '۹+' : formatNumber(badge(item)) }}
            </span>
          </span>
          <span class="max-w-full truncate">{{ item.label }}</span>
        </NuxtLink>
      </li>
      <li v-if="$slots.more" class="flex min-w-0 flex-1">
        <button
          type="button"
          class="pressable flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-semibold leading-none text-ink-500 transition-colors hover:text-ink-700"
          @click="emit('more')"
        >
          <span class="flex h-7 w-12 items-center justify-center rounded-full">
            <UIcon name="i-lucide-ellipsis" class="size-[22px]" aria-hidden="true" />
          </span>
          <slot name="more" />
        </button>
      </li>
    </ul>
  </nav>
</template>
