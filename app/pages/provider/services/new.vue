<script setup lang="ts">
import type { ServiceCategory } from '~~/shared/types/provider'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const toast = useToast()
const categories = ref<ServiceCategory[]>([])
const pending = ref(false)
const error = ref('')
const loadError = ref('')
const ready = ref(false)

async function loadCategories() {
  loadError.value = ''
  try {
    const res = await $fetch<{ data: { categories: ServiceCategory[] } }>('/api/service-categories')
    categories.value = res.data.categories
    ready.value = true
  }
  catch (err) {
    loadError.value = apiErrorMessage(err, 'بارگذاری دسته‌ها ناموفق بود')
  }
}

onMounted(loadCategories)

async function submit(payload: Record<string, unknown>) {
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/provider/services', { method: 'POST', body: payload })
    toast.add({ title: 'خدمت ثبت شد', icon: 'i-lucide-check', color: 'success' })
    await navigateTo('/provider/services')
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'ثبت خدمت ناموفق بود')
  }
  finally {
    pending.value = false
  }
}

useHead({ title: 'خدمت جدید | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-narrow px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="خدمت جدید" compact :back="{ to: '/provider/services', label: 'خدمات من' }" />
    <AppState v-if="loadError" variant="error" :title="loadError" retry @retry="loadCategories" />
    <SkeletonList v-else-if="!ready" :rows="3" />
    <ProviderServiceForm v-else :categories="categories" :pending="pending" :error="error" submit-label="ثبت خدمت" @submit="submit" />
  </div>
</template>
