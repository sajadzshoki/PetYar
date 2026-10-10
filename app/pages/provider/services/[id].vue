<script setup lang="ts">
import type { ProviderService, ServiceCategory } from '~~/shared/types/provider'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const route = useRoute()
const toast = useToast()
const id = computed(() => String(route.params.id))
const service = ref<ProviderService | null>(null)
const categories = ref<ServiceCategory[]>([])
const loading = ref(true)
const pending = ref(false)
const error = ref('')
const loadError = ref('')

async function load() {
  loading.value = true
  loadError.value = ''
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
}

onMounted(load)

async function submit(payload: Record<string, unknown>) {
  pending.value = true
  error.value = ''
  try {
    await $fetch(`/api/provider/services/${id.value}`, { method: 'PATCH', body: payload })
    toast.add({ title: 'تغییرات ذخیره شد', icon: 'i-lucide-check', color: 'success' })
    await navigateTo('/provider/services')
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'ذخیره ناموفق بود')
  }
  finally {
    pending.value = false
  }
}

useHead({ title: 'ویرایش خدمت | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-narrow px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="ویرایش خدمت" compact :back="{ to: '/provider/services', label: 'خدمات من' }" />
    <SkeletonList v-if="loading" :rows="3" />
    <AppState v-else-if="loadError" variant="error" :title="loadError" retry @retry="load" />
    <ProviderServiceForm v-else-if="service" :service="service" :categories="categories" :pending="pending" :error="error" submit-label="ذخیره تغییرات" @submit="submit" />
  </div>
</template>
