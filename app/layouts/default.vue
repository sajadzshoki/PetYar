<script setup lang="ts">
const route = useRoute()
const { loggedIn } = useUserSession()

const showBottomNav = computed(() => route.meta.bottomNav !== false)
const tabs = computed(() => (loggedIn.value ? CUSTOMER_TABS : GUEST_TABS))
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-canvas text-default">
    <AppHeader />
    <main class="flex-1" :class="showBottomNav ? 'pb-nav md:pb-0' : ''">
      <slot />
    </main>
    <AppFooter />
    <AppBottomNav v-if="showBottomNav" :items="tabs" />
  </div>
</template>
