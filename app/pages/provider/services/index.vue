<script setup lang="ts">
import type { ProviderService } from '~~/shared/types/provider'
import { PRICING_TYPE_LABELS } from '~~/shared/constants/providers'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const services = ref<ProviderService[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { services: ProviderService[] } }>('/api/provider/services')
    services.value = res.data.services
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری خدمات ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

async function toggle(svc: ProviderService) {
  await $fetch(`/api/provider/services/${svc.id}`, {
    method: 'PATCH',
    body: {
      categoryId: svc.categoryId,
      title: svc.title,
      description: svc.description,
      pricingType: svc.pricingType,
      price: svc.price,
      durationMinutes: svc.durationMinutes,
      capacity: svc.capacity,
      isActive: !svc.isActive,
    },
  })
  await load()
}

async function remove(id: string) {
  if (!confirm('این خدمت حذف شود؟')) return
  await $fetch(`/api/provider/services/${id}`, { method: 'DELETE' })
  await load()
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-12">
    <NuxtLink to="/provider" class="text-sm text-ink-600">پرونده ارائه‌دهنده</NuxtLink>
    <div class="mt-3 flex items-end justify-between gap-4">
      <h1 class="text-2xl font-semibold">خدمات من</h1>
      <UButton to="/provider/services/new" size="sm">خدمت جدید</UButton>
    </div>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <AppState v-else-if="error" :title="error" />
    <AppState v-else-if="!services.length" title="خدمتی ثبت نشده" description="عنوان، قیمت و دسته را اضافه کنید.">
      <UButton to="/provider/services/new">افزودن خدمت</UButton>
    </AppState>
    <ul v-else class="mt-8 divide-y divide-ink-200 border-t border-ink-200">
      <li v-for="svc in services" :key="svc.id" class="py-4">
        <p class="text-xs text-forest-700">{{ svc.categoryName }}</p>
        <p class="mt-1 font-medium">
          {{ svc.title }}
          <span v-if="!svc.isActive" class="mr-2 text-xs font-normal text-ink-500">غیرفعال</span>
        </p>
        <p class="mt-1 text-sm text-ink-600">{{ PRICING_TYPE_LABELS[svc.pricingType] }}<template v-if="svc.price != null"> · {{ svc.price }} تومان</template></p>
        <div class="mt-3 flex flex-wrap gap-4 text-sm">
          <NuxtLink :to="`/provider/services/${svc.id}`" class="text-terracotta-700">ویرایش</NuxtLink>
          <button type="button" class="text-ink-600" @click="toggle(svc)">{{ svc.isActive ? 'غیرفعال کردن' : 'فعال کردن' }}</button>
          <button type="button" class="text-ink-500" @click="remove(svc.id)">حذف</button>
        </div>
      </li>
    </ul>
  </div>
</template>
