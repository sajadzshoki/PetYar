<script setup lang="ts">
import type { ProviderProfile } from '~~/shared/types/provider'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const provider = ref<ProviderProfile | null>(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  try {
    const res = await $fetch<{ data: { provider: ProviderProfile | null } }>('/api/provider')
    provider.value = res.data.provider
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-10">
    <h1 class="text-2xl font-semibold">احراز هویت</h1>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <p v-else-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
    <template v-else>
      <p class="mt-3 text-sm leading-7 text-ink-700">
        بررسی مدارک و نشان تأیید در پت‌یار هنوز پیاده نشده است. نشان ساختگی نمایش داده نمی‌شود.
      </p>
      <p v-if="provider" class="mt-4 text-sm text-ink-600">
        پرونده عمومی: {{ provider.isActive ? 'فعال و قابل مشاهده' : 'غیرفعال' }}
      </p>
      <p v-else class="mt-4 text-sm text-ink-600">ابتدا پرونده ارائه‌دهنده بسازید.</p>
    </template>
  </div>
</template>
