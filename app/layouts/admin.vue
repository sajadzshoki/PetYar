<script setup lang="ts">
const route = useRoute()
const links = [
  { to: '/admin', label: 'نمای کلی', exact: true },
  { to: '/admin/users', label: 'کاربران' },
  { to: '/admin/providers', label: 'ارائه‌دهندگان' },
  { to: '/admin/verifications', label: 'احراز' },
  { to: '/admin/bookings', label: 'رزروها' },
  { to: '/admin/reports', label: 'گزارش‌ها' },
  { to: '/admin/disputes', label: 'اختلاف‌ها' },
  { to: '/admin/reviews', label: 'نظرها' },
  { to: '/admin/audit', label: 'ممیزی' },
]
function active(link: { to: string, exact?: boolean }) {
  if (link.exact) return route.path === link.to
  return route.path === link.to || route.path.startsWith(`${link.to}/`)
}
</script>

<template>
  <div class="min-h-dvh flex flex-col bg-canvas text-ink-900">
    <AppHeader />
    <nav class="border-b border-ink-200 bg-paper">
      <div class="mx-auto flex max-w-5xl gap-4 overflow-x-auto px-4 py-2 text-sm">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="shrink-0 py-1"
          :class="active(link) ? 'text-ink-900' : 'text-ink-500'"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
    </nav>
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
