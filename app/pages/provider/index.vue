<script setup lang="ts">
import type { ProviderProfile } from '~~/shared/types/provider'
import type { Booking } from '~~/shared/types/booking'
import type { ProviderEarnings } from '~~/shared/types/payment'
import { VERIFICATION_STATUS_LABELS, type VerificationStatus } from '~~/shared/constants/moderation'
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
const upcoming = computed(() =>
  bookings.value
    .filter(b => b.status === 'CONFIRMED' || b.status === 'ACCEPTED')
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 5),
)

const verificationMeta = computed(() => {
  const s = (provider.value?.verificationStatus || 'UNVERIFIED') as VerificationStatus
  return { label: VERIFICATION_STATUS_LABELS[s] ?? s, meta: VERIFICATION_STATUS_META[s] ?? VERIFICATION_STATUS_META.UNVERIFIED }
})

const stats = computed(() => [
  { label: 'در انتظار پاسخ', value: pending.value.length, icon: 'i-lucide-inbox', to: '/provider/bookings', accent: pending.value.length > 0 },
  { label: 'پیش‌رو', value: upcoming.value.length, icon: 'i-lucide-calendar-check', to: '/provider/bookings', accent: false },
  { label: 'پرداخت‌شده', value: earnings.value?.paidCount ?? 0, icon: 'i-lucide-wallet', to: '/provider/earnings', accent: false },
])

useHead({ title: 'کارتابل ارائه‌دهنده | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader
      eyebrow="فضای کاری"
      :title="provider ? provider.displayName : 'کارتابل ارائه‌دهنده'"
      description="کارهای باز و خلاصه مالی از پرداخت‌های ثبت‌شده."
    >
      <template v-if="provider" #meta>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge :label="verificationMeta.label" :meta="verificationMeta.meta" size="sm" />
          <UBadge v-if="!provider.isActive" color="neutral" variant="subtle" size="sm" class="rounded-full" icon="i-lucide-eye-off">غیرفعال</UBadge>
        </div>
      </template>
      <template v-if="provider" #actions>
        <UButton :to="`/providers/${provider.id}`" color="neutral" variant="outline" size="md" icon="i-lucide-eye">نمای عمومی</UButton>
      </template>
    </PageHeader>

    <SkeletonList v-if="loading" :rows="3" />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />

    <AppState
      v-else-if="!provider"
      icon="i-lucide-store"
      title="هنوز پرونده ارائه‌دهنده ندارید"
      description="با ساخت پرونده، خدمات‌تان را ثبت کنید و درخواست رزرو بگیرید."
    >
      <UButton to="/provider/profile" icon="i-lucide-plus">ساخت پرونده</UButton>
    </AppState>

    <template v-else>
      <!-- Quick stats -->
      <ul class="grid grid-cols-3 gap-2 sm:gap-3">
        <li v-for="s in stats" :key="s.label">
          <NuxtLink
            :to="s.to"
            class="pressable surface flex h-full flex-col items-center justify-center gap-1 px-2 py-4 text-center transition-colors hover:border-forest-300"
            :class="s.accent && 'ring-forest-300 bg-forest-50'"
          >
            <UIcon :name="s.icon" class="size-5" :class="s.accent ? 'text-primary' : 'text-muted'" aria-hidden="true" />
            <span class="num text-2xl font-extrabold text-highlighted">{{ formatNumber(s.value) }}</span>
            <span class="text-xs text-muted">{{ s.label }}</span>
          </NuxtLink>
        </li>
      </ul>

      <UAlert
        v-if="provider.verificationStatus === 'UNVERIFIED' || provider.verificationStatus === 'NEEDS_CHANGES'"
        class="mt-4"
        color="warning"
        variant="subtle"
        icon="i-lucide-badge-check"
        title="احراز هویت را تکمیل کنید"
        description="ارائه‌دهنده‌های احرازشده نشان تأیید می‌گیرند و اعتماد بیشتری جلب می‌کنند."
        :actions="[{ label: 'شروع احراز هویت', to: '/provider/verification', color: 'warning', variant: 'solid', size: 'sm' }]"
      />

      <!-- Pending requests -->
      <AppSection title="در انتظار پاسخ" description="هرچه زودتر پاسخ دهید، شانس تأیید بیشتر است." class="mt-6" flush>
        <template #actions>
          <UButton to="/provider/bookings" color="neutral" variant="ghost" size="sm" trailing-icon="i-lucide-chevron-left">همه</UButton>
        </template>
        <p v-if="!pending.length" class="px-4 pb-4 text-sm text-muted sm:px-5">درخواست بازی نیست.</p>
        <ul v-else class="divide-y divide-muted border-t border-muted">
          <li v-for="item in pending" :key="item.id">
            <ListRow :to="`/provider/bookings/${item.id}`">
              <template #leading>
                <span class="flex size-10 items-center justify-center rounded-full bg-terracotta-50 text-terracotta-600">
                  <UIcon name="i-lucide-bell-ring" class="size-5" aria-hidden="true" />
                </span>
              </template>
              <p class="font-semibold text-highlighted">{{ item.serviceTitle }} · {{ item.petName }}</p>
              <p class="mt-0.5 text-sm text-muted">{{ formatDayShort(item.startAt) }} · <span class="num">{{ formatTime(item.startAt) }}</span></p>
            </ListRow>
          </li>
        </ul>
      </AppSection>

      <!-- Upcoming -->
      <AppSection title="رزروهای پیش‌رو" class="mt-6" flush>
        <p v-if="!upcoming.length" class="px-4 pb-4 text-sm text-muted sm:px-5">مورد تأییدشده‌ای در صف نیست.</p>
        <ul v-else class="grid gap-2 px-4 pb-4 sm:px-5">
          <li v-for="item in upcoming" :key="item.id">
            <BookingRow :booking="item" :to="`/provider/bookings/${item.id}`" perspective="provider" />
          </li>
        </ul>
      </AppSection>

      <!-- Earnings -->
      <AppSection v-if="earnings" title="خلاصه مالی" description="اعداد از پرداخت‌های ثبت‌شده محاسبه می‌شوند، نه برآورد." class="mt-6">
        <template #actions>
          <UButton to="/provider/earnings" color="neutral" variant="ghost" size="sm" trailing-icon="i-lucide-chevron-left">جزئیات</UButton>
        </template>
        <dl class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div class="rounded-lg bg-canvas-deep p-3">
            <dt class="text-xs text-muted">سهم شما</dt>
            <dd class="mt-1 text-lg font-extrabold text-highlighted">{{ formatToman(earnings.providerEarnings) }}</dd>
          </div>
          <div class="rounded-lg bg-canvas-deep p-3">
            <dt class="text-xs text-muted">دریافتی تأییدشده</dt>
            <dd class="mt-1 font-bold text-highlighted">{{ formatToman(earnings.grossPaid) }}</dd>
          </div>
          <div class="rounded-lg bg-canvas-deep p-3">
            <dt class="text-xs text-muted">کارمزد پلتفرم</dt>
            <dd class="mt-1 font-bold text-highlighted">{{ formatToman(earnings.platformFees) }}</dd>
          </div>
          <div class="rounded-lg bg-canvas-deep p-3">
            <dt class="text-xs text-muted">پرداخت‌نشده</dt>
            <dd class="mt-1 font-bold text-highlighted">{{ formatToman(earnings.unpaid) }}</dd>
          </div>
        </dl>
      </AppSection>
    </template>
  </div>
</template>
