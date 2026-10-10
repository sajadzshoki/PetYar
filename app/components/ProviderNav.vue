<script setup lang="ts">
const route = useRoute()

const links = [
  { to: '/provider', label: 'کارتابل', exact: true },
  { to: '/provider/bookings', label: 'رزروها' },
  { to: '/provider/availability', label: 'تقویم' },
  { to: '/provider/services', label: 'خدمات' },
  { to: '/provider/profile', label: 'پرونده' },
  { to: '/provider/reviews', label: 'نظرها' },
  { to: '/provider/earnings', label: 'درآمد' },
  { to: '/provider/transactions', label: 'تراکنش‌ها' },
  { to: '/provider/verification', label: 'احراز' },
  { to: '/provider/settings', label: 'حساب' },
]

function active(link: { to: string, exact?: boolean }) {
  if (link.exact) return route.path === link.to
  return route.path === link.to || route.path.startsWith(`${link.to}/`)
}
</script>

<template>
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
</template>
