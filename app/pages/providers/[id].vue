<script setup lang="ts">
import type { PublicProvider } from '~~/shared/types/provider'
import type { CalendarDay } from '~~/shared/types/availability'
import { PRICING_TYPE_LABELS } from '~~/shared/constants/providers'
import { WEEKDAY_LABELS } from '~~/shared/constants/availability'
import { apiErrorMessage } from '~/utils/api-error'

const route = useRoute()
const id = computed(() => String(route.params.id))
const provider = ref<PublicProvider | null>(null)
const week = ref<CalendarDay[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { provider: PublicProvider } }>(`/api/providers/${id.value}`)
    provider.value = res.data.provider
    const from = new Date().toISOString().slice(0, 10)
    const toDate = new Date()
    toDate.setUTCDate(toDate.getUTCDate() + 6)
    const to = toDate.toISOString().slice(0, 10)
    try {
      const cal = await $fetch<{ data: { days: CalendarDay[] } }>(`/api/providers/${id.value}/calendar`, { query: { from, to } })
      week.value = cal.data.days
    }
    catch {
      week.value = []
    }
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

async function startChat() {
  if (!provider.value) return
  try {
    const res = await $fetch<{ data: { conversation: { id: string } } }>('/api/conversations', {
      method: 'POST',
      body: { providerId: provider.value.id },
    })
    await navigateTo(`/inbox/${res.data.conversation.id}`)
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'گفتگو باز نشد. وارد حساب شوید.')
  }
}
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
          <UButton class="mt-4" size="sm" color="neutral" variant="outline" @click="startChat">پیام به ارائه‌دهنده</UButton>
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
            <NuxtLink :to="`/bookings/new?provider=${provider.id}&service=${svc.id}`" class="mt-2 inline-block text-sm text-terracotta-700">درخواست رزرو</NuxtLink>
          </li>
        </ul>
      </section>

      <section class="mt-10 border-t border-ink-200 pt-8">
        <h2 class="text-lg font-medium">ساعت‌های پیش‌رو</h2>
        <p class="mt-2 text-sm leading-7 text-ink-600">وقت تهران. بازه‌های رزروشده در تقویم کم می‌شوند.</p>
        <ul v-if="week.length" class="mt-4 divide-y divide-ink-100 text-sm">
          <li v-for="day in week" :key="day.date" class="flex justify-between gap-3 py-2">
            <span>{{ WEEKDAY_LABELS[day.weekday] }} · {{ day.date }}</span>
            <span v-if="day.slots.length" class="text-ink-700">
              {{ day.slots.map(s => `${s.startTime}–${s.endTime}`).join('، ') }}
            </span>
            <span v-else class="text-ink-400">تعطیل</span>
          </li>
        </ul>
        <p v-else class="mt-3 text-sm text-ink-500">ساعت کاری اعلام نشده است.</p>
        <p v-if="provider.latitude != null && provider.longitude != null" class="mt-4 text-sm text-ink-500" dir="ltr">
          {{ provider.latitude }}, {{ provider.longitude }}
        </p>
      </section>
    </template>
  </div>
</template>
