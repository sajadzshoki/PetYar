<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'fa', dir: 'rtl' },
})
</script>

<template>
  <UApp dir="rtl" :toaster="{ position: 'top-center', duration: 3500 }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
