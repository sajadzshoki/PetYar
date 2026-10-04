<script setup lang="ts">
import type { ServiceCategory } from '~~/shared/types/provider'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const categories = ref<ServiceCategory[]>([])
const pending = ref(false)
const error = ref('')
const ready = ref(false)

onMounted(async () => {
  const res = await $fetch<{ data: { categories: ServiceCategory[] } }>('/api/service-categories')
  categories.value = res.data.categories
  ready.value = true
})

async function submit(payload: Record<string, unknown>) {
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/provider/services', { method: 'POST', body: payload })
    await navigateTo('/provider/services')
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'ثبت خدمت ناموفق بود')
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-12">
    <NuxtLink to="/provider/services" class="text-sm text-ink-600">بازگشت</NuxtLink>
    <h1 class="mt-3 text-2xl font-semibold">خدمت جدید</h1>
    <div v-if="ready" class="mt-8">
      <ProviderServiceForm :categories="categories" :pending="pending" :error="error" @submit="submit" />
    </div>
  </div>
</template>
