<script setup lang="ts">
const props = defineProps<{ error: { statusCode?: number, statusMessage?: string, message?: string } }>()

const code = computed(() => props.error?.statusCode || 500)
const title = computed(() => {
  if (code.value === 404) return 'صفحه پیدا نشد'
  if (code.value === 403) return 'دسترسی مجاز نیست'
  return 'مشکلی پیش آمد'
})
const description = computed(() => {
  if (code.value === 404) return 'نشانی را بررسی کنید یا از صفحه اصلی دوباره شروع کنید.'
  if (code.value === 403) return 'برای دیدن این بخش باید با حساب مناسب وارد شوید.'
  return 'لطفاً دوباره تلاش کنید. اگر مشکل ادامه داشت، بعداً سر بزنید.'
})

function goTo(path: string) {
  clearError({ redirect: path })
}
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 py-16 text-center text-default">
    <img src="/brand/petyar-mark.png" alt="" width="96" height="96" class="size-24 opacity-90">
    <p class="num mt-8 text-sm font-semibold text-terracotta-600">{{ formatNumber(code) }}</p>
    <h1 class="mt-2 text-2xl font-bold text-highlighted sm:text-3xl">{{ title }}</h1>
    <p class="mt-3 max-w-sm text-sm leading-7 text-muted">{{ description }}</p>
    <div class="mt-8 flex flex-wrap items-center justify-center gap-2">
      <UButton icon="i-lucide-house" @click="goTo('/')">بازگشت به خانه</UButton>
      <UButton color="neutral" variant="outline" icon="i-lucide-search" @click="goTo('/providers')">جستجوی خدمات</UButton>
    </div>
  </div>
</template>
