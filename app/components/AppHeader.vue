<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const props = withDefaults(defineProps<{
  /** Which workspace the header belongs to; affects desktop links. */
  context?: 'customer' | 'provider' | 'admin'
}>(), {
  context: 'customer',
})

const route = useRoute()
const { loggedIn, user, clear } = useUserSession()
const { count: unread, refresh } = useUnreadNotifications()

const displayName = computed(() => user.value?.displayName || user.value?.email || '')
const role = computed(() => user.value?.role)
const isProvider = computed(() => role.value === 'PROVIDER' || role.value === 'ADMIN')
const isAdmin = computed(() => role.value === 'ADMIN')

const desktopLinks = computed<Array<{ to: string, label: string, exact?: boolean }>>(() => {
  if (props.context === 'admin') return [{ to: '/', label: 'نمای مشتری' }]
  if (props.context === 'provider') return [{ to: '/', label: 'نمای مشتری' }, { to: '/providers', label: 'ارائه‌دهندگان' }]
  const links = [{ to: '/providers', label: 'ارائه‌دهندگان' }]
  if (loggedIn.value) {
    links.push({ to: '/bookings', label: 'رزروها' }, { to: '/inbox', label: 'پیام‌ها' }, { to: '/pets', label: 'حیوانات من' })
  }
  else {
    links.push({ to: '/#how', label: 'چطور کار می‌کند' })
  }
  return links
})

function linkActive(to: string) {
  if (to === '/') return route.path === '/'
  if (to.startsWith('/#')) return false
  return route.path === to || route.path.startsWith(`${to}/`)
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/')
}

const menuItems = computed<DropdownMenuItem[][]>(() => {
  const main: DropdownMenuItem[] = [
    { label: 'حساب من', icon: 'i-lucide-user-round', to: '/account' },
    { label: 'حیوانات من', icon: 'i-lucide-paw-print', to: '/pets' },
    { label: 'ذخیره‌شده‌ها', icon: 'i-lucide-heart', to: '/favorites' },
    { label: 'اعلان‌ها', icon: 'i-lucide-bell', to: '/notifications' },
  ]
  const spaces: DropdownMenuItem[] = [
    { label: isProvider.value ? 'کارتابل ارائه‌دهنده' : 'ارائه‌دهنده شوید', icon: 'i-lucide-briefcase', to: '/provider' },
  ]
  if (isAdmin.value) spaces.push({ label: 'مدیریت', icon: 'i-lucide-shield-check', to: '/admin' })
  const end: DropdownMenuItem[] = [
    { label: 'خروج از حساب', icon: 'i-lucide-log-out', color: 'error', onSelect: () => { logout() } },
  ]
  return [main, spaces, end]
})

watch(() => route.fullPath, () => {
  refresh()
}, { immediate: true })
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-default bg-paper/95 pt-safe backdrop-blur supports-[backdrop-filter]:bg-paper/85">
    <div class="mx-auto flex h-header max-w-page items-center justify-between gap-3 px-4 sm:px-6 lg:h-header-lg">
      <div class="flex min-w-0 items-center gap-4 lg:gap-8">
        <AppLogo :size="34" />
        <span
          v-if="context !== 'customer'"
          class="hidden rounded-full bg-canvas-deep px-2.5 py-0.5 text-xs font-semibold text-toned sm:inline-block"
        >
          {{ context === 'admin' ? 'مدیریت' : 'ارائه‌دهنده' }}
        </span>

        <nav class="hidden items-center gap-1 md:flex" aria-label="ناوبری اصلی">
          <NuxtLink
            v-for="link in desktopLinks"
            :key="link.to"
            :to="link.to"
            class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-canvas hover:text-highlighted"
            :class="linkActive(link.to) ? 'text-highlighted' : 'text-toned'"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>

      <div class="flex items-center gap-1 sm:gap-2">
        <template v-if="loggedIn">
          <UButton
            to="/notifications"
            color="neutral"
            variant="ghost"
            size="md"
            square
            class="relative"
            aria-label="اعلان‌ها"
          >
            <UIcon name="i-lucide-bell" class="size-5" />
            <span
              v-if="unread > 0"
              class="absolute -top-0.5 -start-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta-500 px-1 text-[10px] font-bold leading-none text-white"
              aria-label="اعلان خوانده‌نشده"
            >
              {{ unread > 9 ? '۹+' : formatNumber(unread) }}
            </span>
          </UButton>

          <UDropdownMenu :items="menuItems" :content="{ align: 'end' }" :ui="{ content: 'w-56' }">
            <UButton color="neutral" variant="ghost" size="md" class="hidden md:inline-flex" trailing-icon="i-lucide-chevron-down">
              <span class="max-w-36 truncate">{{ displayName }}</span>
            </UButton>
          </UDropdownMenu>
        </template>
        <template v-else>
          <UButton to="/login" color="neutral" variant="ghost" size="md">ورود</UButton>
          <UButton to="/register" size="md" class="hidden sm:inline-flex">ثبت‌نام</UButton>
        </template>
      </div>
    </div>
  </header>
</template>
