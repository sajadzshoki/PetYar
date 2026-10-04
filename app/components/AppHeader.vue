<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()
const displayName = computed(() => {
  const u = user.value as { displayName?: string, email?: string } | null
  return u?.displayName || u?.email || ''
})
const open = ref(false)

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  open.value = false
  await navigateTo('/')
}
</script>

<template>
  <header class="border-b border-ink-200/70 bg-paper/90 backdrop-blur-sm sticky top-0 z-40">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <NuxtLink to="/" class="flex items-center gap-2.5">
        <span class="flex h-9 w-9 items-center justify-center rounded-md bg-terracotta-500 text-white">
          <UIcon name="i-lucide-paw-print" class="size-5" />
        </span>
        <span class="text-lg font-semibold tracking-tight">پت‌یار</span>
      </NuxtLink>

      <nav class="hidden items-center gap-7 text-sm text-ink-700 md:flex">
        <NuxtLink to="/providers" class="hover:text-ink-900">ارائه‌دهندگان</NuxtLink>
        <NuxtLink to="/#how" class="hover:text-ink-900">چطور کار می‌کند</NuxtLink>
        <NuxtLink v-if="loggedIn" to="/pets" class="hover:text-ink-900">حیوانات من</NuxtLink>
        <NuxtLink v-if="loggedIn" to="/provider" class="hover:text-ink-900">خدمات من</NuxtLink>
        <NuxtLink v-if="loggedIn" to="/account" class="hover:text-ink-900">حساب من</NuxtLink>
      </nav>

      <div class="hidden items-center gap-2 md:flex">
        <template v-if="loggedIn">
          <span class="max-w-36 truncate text-sm text-ink-600">{{ displayName }}</span>
          <UButton color="neutral" variant="outline" size="sm" @click="logout">خروج</UButton>
        </template>
        <template v-else>
          <UButton to="/login" color="neutral" variant="ghost" size="sm">ورود</UButton>
          <UButton to="/register" size="sm">شروع کنید</UButton>
        </template>
      </div>

      <UButton
        class="md:hidden"
        color="neutral"
        variant="ghost"
        icon="i-lucide-menu"
        square
        @click="open = !open"
      />
    </div>

    <div v-if="open" class="border-t border-ink-200 px-4 py-3 md:hidden">
      <div class="flex flex-col gap-3 text-sm">
        <NuxtLink to="/providers" @click="open = false">ارائه‌دهندگان</NuxtLink>
        <NuxtLink to="/#how" @click="open = false">چطور کار می‌کند</NuxtLink>
        <NuxtLink v-if="loggedIn" to="/pets" @click="open = false">حیوانات من</NuxtLink>
        <NuxtLink v-if="loggedIn" to="/provider" @click="open = false">خدمات من</NuxtLink>
        <NuxtLink v-if="loggedIn" to="/account" @click="open = false">حساب من</NuxtLink>
        <UButton v-if="loggedIn" color="neutral" variant="outline" block @click="logout">خروج</UButton>
        <div v-else class="flex gap-2">
          <UButton to="/login" color="neutral" variant="outline" class="flex-1" @click="open = false">ورود</UButton>
          <UButton to="/register" class="flex-1" @click="open = false">ثبت‌نام</UButton>
        </div>
      </div>
    </div>
  </header>
</template>
