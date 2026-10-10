<script setup lang="ts">
import type { ProviderService, ServiceCategory } from '~~/shared/types/provider'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const service = ref<ProviderService | null>(null)
const categories = ref<ServiceCategory[]>([])
const loading = ref(true)
const pending = ref(false)
const error = ref('')
const loadError = ref('')

onMounted(async () => {
  try {
    const [svcRes, catRes] = await Promise.all([
      $fetch<{ data: { services: ProviderService[] } }>('/api/provider/services'),
      $fetch<{ data: { categories: ServiceCategory[] } }>('/api/service-categories'),
    ])
    categories.value = catRes.data.categories
    service.value = svcRes.data.services.find(s => s.id === id.value) || null
    if (!service.value) loadError.value = 'خدمت یافت نشد'
  }
  catch (err) {
    loadError.value = apiErrorMessage(err, 'بارگذاری ناموفق بود')
  }
  finally {
    loading.value = false
  }
})

async function submit(payload: Record<string, unknown>) {
  pending.value = true
  error.value = ''
  try {
    await $fetch(`/api/provider/services/${id.value}`, { method: 'PATCH', body: payload })
    await navigateTo('/provider/services')
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'ذخیره ناموفق بود')
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-12">
    <NuxtLink to="/provider/services" class="text-sm text-ink-600">بازگشت</NuxtLink>
    <h1 class="mt-3 text-2xl font-semibold">ویرایش خدمت</h1>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <AppState v-else-if="loadError" :title="loadError" />
    <div v-else-if="service" class="mt-8">
      <ProviderServiceForm :service="service" :categories="categories" :pending="pending" :error="error" @submit="submit" />
    </div>
  </div>
</template>
