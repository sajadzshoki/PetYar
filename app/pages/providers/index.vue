<script setup lang="ts">
import type { ProviderProfile } from '~~/shared/types/provider'
import { apiErrorMessage } from '~/utils/api-error'

const providers = ref<ProviderProfile[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { providers: ProviderProfile[] } }>('/api/providers')
    providers.value = res.data.providers
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری ارائه‌دهندگان ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-12">
    <p class="text-sm text-forest-700">بازار خدمات</p>
    <h1 class="mt-1 text-2xl font-semibold">ارائه‌دهندگان</h1>
    <p class="mt-2 max-w-lg text-sm leading-7 text-ink-600">
      آدم‌هایی که نگهداری، آرایش، آموزش و مراقبت را نزدیک شما انجام می‌دهند.
      رزرو در فازهای بعد فعال می‌شود.
    </p>

    <AppState v-if="loading" title="در حال بارگذاری…" />
    <AppState v-else-if="error" :title="error" />
    <AppState
      v-else-if="providers.length === 0"
      title="هنوز ارائه‌دهنده‌ای فعال نیست"
      description="اگر خدمات می‌دهید، پرونده خود را بسازید."
    >
      <UButton to="/provider">ساخت پرونده ارائه‌دهنده</UButton>
    </AppState>

    <ul v-else class="mt-10 divide-y divide-ink-200 border-t border-ink-200">
      <li v-for="item in providers" :key="item.id">
        <NuxtLink :to="`/providers/${item.id}`" class="flex items-center gap-4 py-5">
          <div class="h-16 w-16 shrink-0 overflow-hidden border border-ink-200 bg-canvas-deep">
            <img v-if="item.photoUrl" :src="item.photoUrl" alt="" class="h-full w-full object-cover">
            <span v-else class="flex h-full w-full items-center justify-center text-ink-400">
              <UIcon name="i-lucide-user" class="size-6" />
            </span>
          </div>
          <div class="min-w-0">
            <p class="font-medium">{{ item.displayName }}</p>
            <p class="mt-1 truncate text-sm text-ink-600">
              {{ [item.city, item.district].filter(Boolean).join('، ') || item.serviceArea || 'محدوده اعلام نشده' }}
            </p>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
