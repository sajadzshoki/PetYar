<script setup lang="ts">
import type { NavItem } from '~/utils/navigation'

/**
 * Provider workspace navigation.
 * Desktop: horizontal tab strip under the header with all destinations.
 * Mobile: bottom navigation with the four primary destinations + a "more" sheet.
 */
const route = useRoute()
const moreOpen = ref(false)

const allLinks = [...PROVIDER_TABS, ...PROVIDER_MORE]

function active(item: NavItem) {
  return isNavActive(route.path, item)
}

const moreActive = computed(() => PROVIDER_MORE.some(active))

watch(() => route.path, () => {
  moreOpen.value = false
})
</script>

<template>
  <!-- Desktop tab strip -->
  <nav class="hidden border-b border-default bg-paper md:block" aria-label="بخش‌های کارتابل">
    <div class="mx-auto flex max-w-page gap-1 overflow-x-auto px-4 scrollbar-none sm:px-6">
      <NuxtLink
        v-for="link in allLinks"
        :key="link.to"
        :to="link.to"
        class="relative flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium transition-colors hover:text-highlighted"
        :class="active(link) ? 'text-highlighted' : 'text-muted'"
        :aria-current="active(link) ? 'page' : undefined"
      >
        <UIcon :name="link.icon" class="size-4" aria-hidden="true" />
        {{ link.label }}
        <span
          v-if="active(link)"
          class="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary"
          aria-hidden="true"
        />
      </NuxtLink>
    </div>
  </nav>

  <!-- Mobile bottom navigation -->
  <AppBottomNav :items="PROVIDER_TABS" @more="moreOpen = true">
    <template #more>
      <span :class="moreActive && 'text-primary'">بیشتر</span>
    </template>
  </AppBottomNav>

  <UModal v-model:open="moreOpen" title="بخش‌های دیگر" description="مدیریت پرونده، درآمد و احراز هویت" :ui="{ content: 'sm:max-w-md' }">
    <template #body>
      <ul class="-mx-2 grid grid-cols-2 gap-2">
        <li v-for="link in PROVIDER_MORE" :key="link.to">
          <NuxtLink
            :to="link.to"
            class="pressable flex min-h-[4.5rem] flex-col items-start justify-center gap-2 rounded-xl border border-default bg-canvas px-4 py-3 text-sm font-semibold transition-colors hover:border-accented"
            :class="active(link) ? 'text-primary ring-2 ring-primary/40' : 'text-highlighted'"
          >
            <UIcon :name="link.icon" class="size-5 text-primary" aria-hidden="true" />
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
      <NuxtLink
        to="/"
        class="mt-4 flex min-h-touch items-center justify-center gap-2 rounded-lg text-sm font-medium text-muted hover:text-highlighted"
      >
        <UIcon name="i-lucide-arrow-up-left" class="size-4" aria-hidden="true" />
        بازگشت به نمای مشتری
      </NuxtLink>
    </template>
  </UModal>
</template>
