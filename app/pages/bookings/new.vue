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
    if (pets.value.length === 1 && pets.value[0]) petId.value = pets.value[0].id
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
    error.value = providerId.value ? apiErrorMessage(err, 'بارگذاری ناموفق بود') : 'ارائه‌دهنده مشخص نشده است.'
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
  return formatToman(q.totalAmount)
}

const openDays = computed(() => days.value.filter(d => d.slots.length))
const selectedDay = computed(() => days.value.find(d => d.date === date.value) || null)

const serviceOptions = computed(() => (provider.value?.services || []).map(s => ({ label: s.title, value: s.id })))
const petOptions = computed(() => pets.value.map(p => ({ label: p.name, value: p.id })))

function pickSlot(slot: { startTime: string, endTime: string }) {
  startTime.value = slot.startTime
  endTime.value = slot.endTime
}

const canSubmit = computed(() => Boolean(petId.value && quote.value?.available && !quoting.value))

useHead({ title: 'درخواست رزرو | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-narrow px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader
      title="درخواست رزرو"
      description="مبلغ نهایی روی سرور محاسبه می‌شود و ارائه‌دهنده باید درخواست را بپذیرد."
      :back="providerId ? { to: `/providers/${providerId}`, label: 'بازگشت به پرونده' } : { to: '/providers', label: 'جستجوی ارائه‌دهنده' }"
    />

    <SkeletonList v-if="loading" :rows="3" />
    <AppState v-else-if="!provider" variant="error" :title="error || 'ارائه‌دهنده یافت نشد'">
      <UButton to="/providers" color="neutral" variant="outline" size="md">جستجوی ارائه‌دهنده</UButton>
    </AppState>

    <form v-else class="space-y-5" @submit.prevent="submit">
      <AppSection>
        <div class="flex items-center gap-3">
          <MediaThumb :src="provider.photoUrl" :alt="provider.displayName" :initial="initialOf(provider.displayName)" size-class="size-12" rounded="lg" />
          <div class="min-w-0">
            <p class="truncate font-bold text-highlighted">{{ provider.displayName }}</p>
            <p class="truncate text-sm text-muted">{{ [provider.city, provider.district].filter(Boolean).join('، ') }}</p>
          </div>
        </div>
      </AppSection>

      <AppSection title="خدمت و حیوان">
        <div class="space-y-4">
          <UFormField label="خدمت" name="service">
            <USelect v-model="serviceId" :items="serviceOptions" class="w-full" :disabled="!serviceOptions.length" placeholder="انتخاب خدمت" />
            <template v-if="service" #help>
              {{ PRICING_TYPE_LABELS[service.pricingType] }}
              <template v-if="service.price != null && service.pricingType !== 'CUSTOM'"> · {{ formatToman(service.price) }}</template>
            </template>
          </UFormField>
          <UFormField label="حیوان" name="pet" required>
            <USelect v-model="petId" :items="petOptions" class="w-full" :disabled="!petOptions.length" placeholder="انتخاب کنید" />
          </UFormField>
          <UAlert
            v-if="!pets.length"
            color="warning"
            variant="subtle"
            icon="i-lucide-paw-print"
            title="هنوز حیوانی ثبت نکرده‌اید"
            description="برای رزرو باید حداقل یک حیوان در پروفایل‌تان باشد."
            :actions="[{ label: 'ثبت حیوان', to: '/pets/new', color: 'warning', variant: 'solid', size: 'sm' }]"
          />
        </div>
      </AppSection>

      <AppSection title="زمان" description="به وقت تهران. فقط روزهایی که ارائه‌دهنده آزاد است نمایش داده می‌شوند.">
        <div v-if="!openDays.length" class="rounded-lg bg-canvas-deep p-4 text-sm leading-7 text-toned">
          این ارائه‌دهنده در دو هفته آینده زمان آزاد اعلام نکرده است. می‌توانید از طریق پیام هماهنگ کنید.
        </div>
        <template v-else>
          <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none" role="radiogroup" aria-label="روز">
            <button
              v-for="day in openDays"
              :key="day.date"
              type="button"
              role="radio"
              :aria-checked="date === day.date"
              class="flex min-h-touch min-w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-xl border px-2 py-2 text-xs font-semibold transition-colors"
              :class="date === day.date ? 'border-primary bg-forest-50 text-primary' : 'border-default bg-paper text-muted hover:border-ink-300'"
              @click="date = day.date"
            >
              <span>{{ formatCalendarDay(day.date, { weekday: 'short', day: undefined, month: undefined }) }}</span>
              <span class="num mt-0.5 text-base text-highlighted">{{ formatCalendarDay(day.date, { weekday: undefined, day: 'numeric', month: undefined }) }}</span>
              <span class="text-[11px] font-normal">{{ formatCalendarDay(day.date, { weekday: undefined, day: undefined, month: 'short' }) }}</span>
            </button>
          </div>

          <div v-if="selectedDay?.slots.length" class="mt-4">
            <p class="text-sm font-medium text-highlighted">بازه‌های آزاد</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="slot in selectedDay.slots"
                :key="slot.startTime"
                type="button"
                class="num min-h-10 rounded-full border px-3 text-sm font-medium transition-colors"
                :class="startTime === slot.startTime && endTime === slot.endTime ? 'border-primary bg-forest-50 text-primary' : 'border-default text-toned hover:border-ink-300'"
                @click="pickSlot(slot)"
              >
                {{ slot.startTime }}–{{ slot.endTime }}
              </button>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-3">
            <UFormField label="شروع" name="start">
              <UInput v-model="startTime" type="time" class="w-full ltr" />
            </UFormField>
            <UFormField label="پایان" name="end">
              <UInput v-model="endTime" type="time" class="w-full ltr" />
            </UFormField>
          </div>
        </template>
      </AppSection>

      <AppSection title="یادداشت برای ارائه‌دهنده" description="اختیاری؛ مثلاً حساسیت‌ها یا عادت‌های حیوان.">
        <UTextarea v-model="note" class="w-full" :rows="3" placeholder="…" />
      </AppSection>

      <!-- Quote summary -->
      <div class="rounded-xl border border-default bg-canvas-deep p-4" aria-live="polite">
        <div v-if="quoting" class="flex items-center gap-2 text-sm text-muted">
          <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" aria-hidden="true" />
          در حال برآورد قیمت…
        </div>
        <template v-else-if="quote">
          <div v-if="!quote.available" class="flex items-start gap-2 text-sm text-red-700">
            <UIcon name="i-lucide-circle-alert" class="mt-1 size-4 shrink-0" aria-hidden="true" />
            <span>{{ quote.reason || 'این بازه آزاد نیست' }}</span>
          </div>
          <dl v-else class="grid grid-cols-2 gap-y-1 text-sm">
            <dt class="text-muted">مدت</dt>
            <dd class="text-end font-medium text-highlighted"><span class="num">{{ formatNumber(quote.durationMinutes) }}</span> دقیقه</dd>
            <dt class="text-muted">مبلغ برآوردی</dt>
            <dd class="text-end text-lg font-extrabold text-highlighted">{{ money(quote) }}</dd>
          </dl>
        </template>
        <p v-else class="text-sm text-muted">خدمت، حیوان و زمان را انتخاب کنید تا مبلغ برآورد شود.</p>
      </div>

      <InlineMessage :message="error" />

      <UButton type="submit" block :loading="pending" :disabled="!canSubmit" icon="i-lucide-send">
        ارسال درخواست رزرو
      </UButton>
    </form>
  </div>
</template>
