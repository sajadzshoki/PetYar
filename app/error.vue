<script setup lang="ts">
const props = defineProps<{ error: { statusCode?: number, statusMessage?: string } }>()

const title = computed(() => {
  if (props.error?.statusCode === 404) return 'صفحه پیدا نشد'
  return 'مشکلی پیش آمد'
})
</script>

<template>
  <div class="min-h-dvh bg-canvas px-4 py-24 text-center text-ink-900">
    <p class="text-sm text-terracotta-600">{{ error?.statusCode || 500 }}</p>
    <h1 class="mt-3 text-2xl font-semibold">{{ title }}</h1>
    <p class="mt-2 text-sm text-ink-600">{{ error?.statusMessage }}</p>
    <UButton class="mt-8" to="/">بازگشت به خانه</UButton>
  </div>
</template>
