<script setup lang="ts">
import type { PublicProvider } from '~~/shared/types/provider'
import type { Pet } from '~~/shared/types/pet'
import type { BookingQuote } from '~~/shared/types/booking'
import type { CalendarDay } from '~~/shared/types/availability'
import { PRICING_TYPE_LABELS } from '~~/shared/constants/providers'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const providerId = computed(() => String(route.query.provider || ''))
const serviceId = ref(String(route.query.service || ''))

const provider = ref<PublicProvider | null>(null)
const pets = ref<Pet[]>([])
const petId = ref('')
const date = ref('')
const startTime = ref('09:00')
const endTime = ref('10:00')
const note = ref('')
const quote = ref<BookingQuote | null>(null)
const days = ref<CalendarDay[]>([])
const loading = ref(true)
const quoting = ref(false)
const pending = ref(false)
const error = ref('')

const service = computed(() => provider.value?.services.find(s => s.id === serviceId.value) || null)

function toIso(day: string, time: string) {
  return new Date(`${day}T${time}:00+03:30`).toISOString()
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (!providerId.value) throw new Error('missing')
    const [p, petRes] = await Promise.all([
      $fetch<{ data: { provider: PublicProvider } }>(`/api/providers/${providerId.value}`),
      $fetch<{ data: { pets: Pet[] } }>('/api/pets'),
    ])
    provider.value = p.data.provider
    pets.value = petRes.data.pets.filter(x => !x.archivedAt)
    if (!serviceId.value && provider.value.services[0]) serviceId.value = provider.value.services[0].id
    const from = new Date().toISOString().slice(0, 10)
    const toDate = new Date()
    toDate.setUTCDate(toDate.getUTCDate() + 13)
    const cal = await $fetch<{ data: { days: CalendarDay[] } }>(`/api/providers/${providerId.value}/calendar`, {
      query: { from, to: toDate.toISOString().slice(0, 10) },
    })
    days.value = cal.data.days
    const firstOpen = days.value.find(d => d.slots.length)
    if (firstOpen) {
      date.value = firstOpen.date
      if (firstOpen.slots[0]) {
        startTime.value = firstOpen.slots[0].startTime
        endTime.value = firstOpen.slots[0].endTime
      }
    }
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

async function refreshQuote() {
  quote.value = null
  if (!providerId.value || !serviceId.value || !date.value || !startTime.value || !endTime.value) return
  quoting.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { quote: BookingQuote } }>('/api/bookings/quote', {
      query: {
        providerId: providerId.value,
        serviceId: serviceId.value,
        start: toIso(date.value, startTime.value),
        end: toIso(date.value, endTime.value),
      },
    })
    quote.value = res.data.quote
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'برآورد قیمت ناموفق بود')
  }
  finally {
    quoting.value = false
  }
}

async function submit() {
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { booking: { id: string } } }>('/api/bookings', {
      method: 'POST',
      body: {
        providerId: providerId.value,
        serviceId: serviceId.value,
        petId: petId.value,
        start: toIso(date.value, startTime.value),
        end: toIso(date.value, endTime.value),
        note: note.value,
      },
    })
    await navigateTo(`/bookings/${res.data.booking.id}`)
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'ثبت رزرو ناموفق بود')
  }
  finally {
    pending.value = false
  }
}

watch([serviceId, date, startTime, endTime], refreshQuote)
onMounted(load)

function money(q: BookingQuote) {
  if (q.negotiable || q.totalAmount == null) return 'قیمت توافقی'
  return `${new Intl.NumberFormat('fa-IR').format(q.totalAmount)} تومان`
}

const openDays = computed(() => days.value.filter(d => d.slots.length))
</script>

<template>
  <div class="mx-auto max-w-xl px-4 py-12">
    <NuxtLink v-if="providerId" :to="`/providers/${providerId}`" class="text-sm text-ink-600">بازگشت به پرونده</NuxtLink>
    <h1 class="mt-3 text-2xl font-semibold">درخواست رزرو</h1>
    <p class="mt-2 text-sm leading-7 text-ink-600">مبلغ را سرور حساب می‌کند. درگاه پرداخت هنوز نیست.</p>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <form v-else-if="provider" class="mt-8 space-y-5" @submit.prevent="submit">
      <p class="font-medium">{{ provider.displayName }}</p>
      <UFormField label="خدمت">
        <select v-model="serviceId" class="w-full rounded-md border border-ink-200 bg-paper px-3 py-2 text-sm">
          <option v-for="svc in provider.services" :key="svc.id" :value="svc.id">{{ svc.title }}</option>
        </select>
      </UFormField>
      <p v-if="service" class="text-sm text-ink-600">{{ PRICING_TYPE_LABELS[service.pricingType] }}</p>
      <UFormField label="حیوان">
        <select v-model="petId" required class="w-full rounded-md border border-ink-200 bg-paper px-3 py-2 text-sm">
          <option value="" disabled>انتخاب کنید</option>
          <option v-for="pet in pets" :key="pet.id" :value="pet.id">{{ pet.name }}</option>
        </select>
      </UFormField>
      <p v-if="!pets.length" class="text-sm text-terracotta-700">
        ابتدا <NuxtLink to="/pets/new" class="underline">حیوان ثبت کنید</NuxtLink>.
      </p>
      <UFormField label="تاریخ (تهران)">
        <select v-model="date" class="w-full rounded-md border border-ink-200 bg-paper px-3 py-2 text-sm" dir="ltr">
          <option v-for="day in openDays" :key="day.date" :value="day.date">{{ day.date }}</option>
        </select>
      </UFormField>
      <div class="grid grid-cols-2 gap-3">
        <UFormField label="شروع">
          <UInput v-model="startTime" type="time" dir="ltr" class="w-full" />
        </UFormField>
        <UFormField label="پایان">
          <UInput v-model="endTime" type="time" dir="ltr" class="w-full" />
        </UFormField>
      </div>
      <p v-if="quoting" class="text-sm text-ink-500">در حال برآورد…</p>
      <div v-else-if="quote" class="border border-ink-100 bg-canvas-deep p-4 text-sm leading-7">
        <p v-if="!quote.available" class="text-terracotta-700">{{ quote.reason || 'این بازه آزاد نیست' }}</p>
        <p v-else>{{ money(quote) }} · {{ quote.durationMinutes }} دقیقه</p>
      </div>
      <UFormField label="یادداشت (اختیاری)">
        <UTextarea v-model="note" class="w-full" />
      </UFormField>
      <p v-if="error" class="text-sm text-terracotta-700">{{ error }}</p>
      <UButton type="submit" :loading="pending" :disabled="!petId || !quote?.available">ارسال درخواست</UButton>
    </form>
    <p v-else class="mt-6 text-sm text-terracotta-700">{{ error }}</p>
  </div>
</template>
