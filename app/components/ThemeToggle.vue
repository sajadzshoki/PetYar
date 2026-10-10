<script setup lang="ts">
/**
 * Light/dark switch. Uses Nuxt UI's color mode (cookie + pre-paint script).
 * Both icons stay in the DOM and CSS picks one, so SSR and the client agree.
 */
const colorMode = useColorMode()

function toggle() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <UButton
    color="neutral"
    variant="ghost"
    size="md"
    square
    aria-label="تغییر حالت روشن و تیره"
    @click="toggle"
  >
    <UIcon name="i-lucide-sun" class="size-5 dark:hidden" aria-hidden="true" />
    <UIcon name="i-lucide-moon" class="hidden size-5 dark:inline-block" aria-hidden="true" />
  </UButton>
</template>
