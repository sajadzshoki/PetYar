<script setup lang="ts">
import type { PublicProvider } from '~~/shared/types/provider'
import { PRICING_TYPE_LABELS } from '~~/shared/constants/providers'
import { apiErrorMessage } from '~/utils/api-error'

const route = useRoute()
const id = computed(() => String(route.params.id))
const provider = ref<PublicProvider | null>(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { provider: PublicProvider } }>(`/api/providers/${id.value}`)
    provider.value = res.data.provider
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'این پرونده در دسترس نیست')
    provider.value = null
  }
  finally {
    loading.value = false
  }
}

function formatPrice(service: PublicProvider['services'][number]) {
  if (service.pricingType === 'CUSTOM' || service.price == null) return PRICING_TYPE_LABELS[service.pricingType]
  const n = new Intl.NumberFormat('fa-IR').format(service.price)
  return `${n} تومان · ${PRICING_TYPE_LABELS[service.pricingType]}`
}

watch(id, load, { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-12">
    <NuxtLink to="/providers" class="text-sm text-ink-600">همه ارائه‌دهندگان</NuxtLink>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <AppState v-else-if="error" :title="error" />
    <template v-else-if="provider">
      <div class="mt-6 sm:flex sm:gap-6">
        <div class="h-40 w-full overflow-hidden border border-ink-200 bg-canvas-deep sm:h-48 sm:w-48 sm:shrink-0">
          <img v-if="provider.photoUrl" :src="provider.photoUrl" :alt="provider.displayName" class="h-full w-full object-cover">
        </div>
        <div class="mt-5 sm:mt-0">
          <h1 class="text-3xl font-semibold tracking-tight">{{ provider.displayName }}</h1>
          <p class="mt-2 text-sm text-ink-600">
            {{ [provider.city, provider.district].filter(Boolean).join('، ') }}
          </p>
          <p v-if="provider.serviceArea" class="mt-1 text-sm text-ink-600">{{ provider.serviceArea }}</p>
          <p v-if="provider.serviceRadiusKm" class="mt-1 text-sm text-ink-500">شعاع خدمات: {{ provider.serviceRadiusKm }} کیلومتر</p>
        </div>
      </div>

      <p v-if="provider.bio" class="mt-8 max-w-xl text-sm leading-8 text-ink-700">{{ provider.bio }}</p>

      <section class="mt-10">
        <h2 class="text-lg font-medium">تجربه</h2>
        <p class="mt-2 text-sm leading-7 text-ink-600">
          <template v-if="provider.experienceYears != null">{{ provider.experienceYears }} سال سابقه. </template>
          {{ provider.experience || 'توضیح بیشتری ثبت نشده است.' }}
        </p>
      </section>

      <section v-if="provider.gallery.length" class="mt-10">
        <h2 class="text-lg font-medium">گالری</h2>
        <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <img
            v-for="img in provider.gallery"
            :key="img.id"
            :src="img.imageUrl"
            alt=""
            class="h-36 w-full object-cover ring-1 ring-ink-200 sm:h-44"
          >
        </div>
      </section>

      <section class="mt-10 border-t border-ink-200 pt-8">
        <h2 class="text-lg font-medium">خدمات</h2>
        <p v-if="!provider.services.length" class="mt-3 text-sm text-ink-500">خدمت فعالی ثبت نشده.</p>
        <ul v-else class="mt-5 divide-y divide-ink-200">
          <li v-for="svc in provider.services" :key="svc.id" class="py-4">
            <p class="text-xs text-forest-700">{{ svc.categoryName }}</p>
            <p class="mt-1 font-medium">{{ svc.title }}</p>
            <p v-if="svc.description" class="mt-1 text-sm leading-7 text-ink-600">{{ svc.description }}</p>
            <p class="mt-2 text-sm text-ink-700">{{ formatPrice(svc) }}</p>
            <p v-if="svc.durationMinutes" class="text-sm text-ink-500">مدت حدودی {{ svc.durationMinutes }} دقیقه · ظرفیت {{ svc.capacity }}</p>
          </li>
        </ul>
      </section>

      <section class="mt-10 border-t border-ink-200 pt-8">
        <h2 class="text-lg font-medium">دسترسی</h2>
        <p class="mt-2 text-sm leading-7 text-ink-600">
          تقویم زمان‌های خالی هنوز فعال نشده است. رزرو و پرداخت در فازهای بعدی می‌آید.
        </p>
        <p v-if="provider.latitude != null && provider.longitude != null" class="mt-2 text-sm text-ink-500" dir="ltr">
          {{ provider.latitude }}, {{ provider.longitude }}
        </p>
      </section>
    </template>
  </div>
</template>
