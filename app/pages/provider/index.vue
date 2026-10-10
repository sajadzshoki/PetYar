<script setup lang="ts">
import type { ProviderProfile } from '~~/shared/types/provider'
import type { Booking } from '~~/shared/types/booking'
import type { ProviderEarnings } from '~~/shared/types/payment'
import { BOOKING_STATUS_LABELS } from '~~/shared/constants/bookings'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const provider = ref<ProviderProfile | null>(null)
const bookings = ref<Booking[]>([])
const earnings = ref<ProviderEarnings | null>(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const p = await $fetch<{ data: { provider: ProviderProfile | null } }>('/api/provider')
    provider.value = p.data.provider
    if (!p.data.provider) return
    const [b, e] = await Promise.all([
      $fetch<{ data: { bookings: Booking[] } }>('/api/provider/bookings'),
      $fetch<{ data: { earnings: ProviderEarnings } }>('/api/provider/earnings').catch(() => null),
    ])
    bookings.value = b.data.bookings
    earnings.value = e?.data.earnings ?? null
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری کارتابل ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

const pending = computed(() => bookings.value.filter(b => b.status === 'PENDING'))
const upcoming = computed(() => bookings.value.filter(b => b.status === 'CONFIRMED' || b.status === 'ACCEPTED').slice(0, 5))

function toman(n: number) {
  return `${new Intl.NumberFormat('fa-IR').format(n)} تومان`
}

function when(iso: string) {
  return new Date(iso).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-10">
    <h1 class="text-2xl font-semibold">کارتابل ارائه‌دهنده</h1>
    <p class="mt-2 text-sm leading-7 text-ink-600">کارهای باز، نه نمودار تزئینی. اعداد درآمد از پرداخت‌های ثبت‌شده می‌آید.</p>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <p v-else-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
    <div v-else-if="!provider" class="mt-8">
      <p class="text-sm leading-7 text-ink-600">هنوز پرونده ارائه‌دهنده ندارید.</p>
      <UButton class="mt-4" to="/provider/profile">ساخت پرونده</UButton>
    </div>
    <template v-else>
      <section class="mt-8">
        <div class="flex items-baseline justify-between">
          <h2 class="text-lg font-medium">در انتظار پاسخ</h2>
          <NuxtLink to="/provider/bookings" class="text-sm text-ink-500">همه رزروها</NuxtLink>
        </div>
        <p v-if="!pending.length" class="mt-3 text-sm text-ink-500">درخواست بازی نیست.</p>
        <ul v-else class="mt-3 divide-y divide-ink-100">
          <li v-for="item in pending" :key="item.id" class="py-3">
            <NuxtLink :to="`/provider/bookings/${item.id}`" class="block">
              <p class="font-medium">{{ item.serviceTitle }} · {{ item.petName }}</p>
              <p class="mt-1 text-sm text-ink-600">{{ when(item.startAt) }}</p>
            </NuxtLink>
          </li>
        </ul>
      </section>

      <section class="mt-10">
        <h2 class="text-lg font-medium">رزروهای پیش‌رو</h2>
        <p v-if="!upcoming.length" class="mt-3 text-sm text-ink-500">مورد تأییدشده‌ای در صف نیست.</p>
        <ul v-else class="mt-3 divide-y divide-ink-100">
          <li v-for="item in upcoming" :key="item.id" class="flex justify-between gap-3 py-3 text-sm">
            <NuxtLink :to="`/provider/bookings/${item.id}`">{{ item.serviceTitle }} · {{ item.petName }}</NuxtLink>
            <span class="text-ink-500">{{ BOOKING_STATUS_LABELS[item.status] }}</span>
          </li>
        </ul>
      </section>

      <section v-if="earnings" class="mt-10 border-t border-ink-200 pt-8">
        <h2 class="text-lg font-medium">خلاصه مالی</h2>
        <p class="mt-2 text-sm leading-7 text-ink-700">
          دریافتی تأییدشده {{ toman(earnings.grossPaid) }} · کارمزد {{ toman(earnings.platformFees) }} · سهم شما {{ toman(earnings.providerEarnings) }}
        </p>
        <p class="mt-1 text-sm text-ink-500">پرداخت‌نشده: {{ toman(earnings.unpaid) }}</p>
        <NuxtLink to="/provider/earnings" class="mt-3 inline-block text-sm text-terracotta-700">جزئیات درآمد</NuxtLink>
      </section>
    </template>
  </div>
</template>
