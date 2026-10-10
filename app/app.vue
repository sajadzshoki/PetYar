<script setup lang="ts">
const colorMode = useColorMode()

const themeColor = computed(() => (colorMode.preference === 'dark' ? '#161311' : '#f8f4ee'))

useHead({
  htmlAttrs: { lang: 'fa', dir: 'rtl' },
  meta: [{ key: 'theme-color', name: 'theme-color', content: themeColor }],
})

// useHead updates its own tag; also write every theme-color meta so a
// server-rendered copy cannot stay stale after a toggle.
if (import.meta.client) {
  watch(themeColor, (content) => {
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute('content', content)
    }
  })
}
</script>

<template>
  <UApp dir="rtl" :toaster="{ position: 'top-center', duration: 3500 }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
