<script setup lang="ts">
import type { PublicProvider } from '~~/shared/types/provider'
import type { CalendarDay } from '~~/shared/types/availability'
import type { Review } from '~~/shared/types/review'
import { PRICING_TYPE_LABELS } from '~~/shared/constants/providers'
import { WEEKDAY_LABELS } from '~~/shared/constants/availability'
import { REVIEW_DIMENSION_LABELS } from '~~/shared/constants/reviews'
import { apiErrorMessage } from '~/utils/api-error'

const { loggedIn } = useUserSession()
const toast = useToast()

const route = useRoute()
const id = computed(() => String(route.params.id))
const provider = ref<PublicProvider | null>(null)
const week = ref<CalendarDay[]>([])
const reviews = ref<Review[]>([])
const favPending = ref(false)
const chatPending = ref(false)
const loading = ref(true)
const error = ref('')
const actionError = ref('')
const lightbox = ref<string | null>(null)
const lightboxOpen = computed({
  get: () => Boolean(lightbox.value),
  set: (open: boolean) => {
    if (!open) lightbox.value = null
  },
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { provider: PublicProvider } }>(`/api/providers/${id.value}`)
    provider.value = res.data.provider
    try {
      const rev = await $fetch<{ data: { reviews: Review[] } }>(`/api/providers/${id.value}/reviews`)
      reviews.value = rev.data.reviews
    }
    catch {
      reviews.value = []
    }
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

function priceLabel(service: PublicProvider['services'][number]) {
  if (service.pricingType === 'CUSTOM' || service.price == null) return null
  return formatNumber(service.price)
}

watch(id, load, { immediate: true })

async function toggleFavorite() {
  if (!provider.value) return
  if (!loggedIn.value) {
    await navigateTo('/login')
    return
  }
  favPending.value = true
  actionError.value = ''
  try {
    if (provider.value.favorited) {
      await $fetch(`/api/favorites/${provider.value.id}`, { method: 'DELETE' })
      provider.value = { ...provider.value, favorited: false }
      toast.add({ title: 'از ذخیره‌شده‌ها حذف شد', icon: 'i-lucide-heart', color: 'neutral' })
    }
    else {
      await $fetch('/api/favorites', { method: 'POST', body: { providerId: provider.value.id } })
      provider.value = { ...provider.value, favorited: true }
      toast.add({ title: 'به ذخیره‌شده‌ها اضافه شد', icon: 'i-lucide-heart', color: 'success' })
    }
  }
  catch (err) {
    actionError.value = apiErrorMessage(err, 'ذخیره نشد')
  }
  finally {
    favPending.value = false
  }
}

async function startChat() {
  if (!provider.value) return
  if (!loggedIn.value) {
    await navigateTo('/login')
    return
  }
  chatPending.value = true
  actionError.value = ''
  try {
    const res = await $fetch<{ data: { conversation: { id: string } } }>('/api/conversations', {
      method: 'POST',
      body: { providerId: provider.value.id },
    })
    await navigateTo(`/inbox/${res.data.conversation.id}`)
  }
  catch (err) {
    actionError.value = apiErrorMessage(err, 'گفتگو باز نشد')
  }
  finally {
    chatPending.value = false
  }
}

const location = computed(() => {
  if (!provider.value) return ''
  return [provider.value.city, provider.value.district].filter(Boolean).join('، ')
})

const ratingDimensions = computed(() => {
  if (!provider.value?.rating.reviewCount) return []
  const r = provider.value.rating
  return [
    { label: REVIEW_DIMENSION_LABELS.communication, value: r.communication },
    { label: REVIEW_DIMENSION_LABELS.quality, value: r.quality },
    { label: REVIEW_DIMENSION_LABELS.punctuality, value: r.punctuality },
    { label: REVIEW_DIMENSION_LABELS.care, value: r.care },
  ]
})

const firstBookableService = computed(() => provider.value?.services[0] || null)

useHead(() => ({ title: provider.value ? `${provider.value.displayName} | پت‌یار` : 'ارائه‌دهنده | پت‌یار' }))
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <NuxtLink
      to="/providers"
      class="-ms-1 mb-3 inline-flex min-h-touch items-center gap-1.5 rounded-md px-1 text-sm font-medium text-muted hover:text-highlighted"
    >
      <UIcon name="i-lucide-arrow-right" class="size-4" aria-hidden="true" />
      همه ارائه‌دهندگان
    </NuxtLink>

    <SkeletonList v-if="loading" :rows="3" />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load">
      <UButton to="/providers" color="neutral" variant="ghost" size="md">بازگشت به جستجو</UButton>
    </AppState>

    <template v-else-if="provider">
      <!-- Profile header -->
      <AppSection>
        <div class="flex items-start gap-4">
          <MediaThumb
            :src="provider.photoUrl"
            :alt="provider.displayName"
            :initial="initialOf(provider.displayName)"
            size-class="size-24 sm:size-32"
            rounded="xl"
          />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl sm:text-3xl">{{ provider.displayName }}</h1>
              <UBadge v-if="provider.verified" color="success" variant="subtle" size="sm" icon="i-lucide-badge-check" class="rounded-full">
                احراز شده
              </UBadge>
            </div>
            <RatingSummary :average="provider.rating.overall" :count="provider.rating.reviewCount" class="mt-1.5" size="md" empty-label="هنوز نظری ثبت نشده" />
            <p v-if="location || provider.serviceArea" class="mt-2 flex items-start gap-1.5 text-sm text-muted">
              <UIcon name="i-lucide-map-pin" class="mt-1 size-4 shrink-0" aria-hidden="true" />
              <span>
                {{ location }}<template v-if="provider.serviceArea"><template v-if="location"> · </template>{{ provider.serviceArea }}</template>
                <template v-if="provider.serviceRadiusKm"> · شعاع <span class="num">{{ formatNumber(provider.serviceRadiusKm) }}</span> کیلومتر</template>
              </span>
            </p>
            <p v-if="provider.experienceYears != null" class="mt-1 text-sm text-muted">
              <span class="num">{{ formatNumber(provider.experienceYears) }}</span> سال سابقه
            </p>
          </div>
        </div>

        <div class="mt-5 flex flex-col gap-2 border-t border-muted pt-4 sm:flex-row sm:flex-wrap sm:items-center">
          <UButton
            v-if="firstBookableService"
            :to="`/bookings/new?provider=${provider.id}&service=${firstBookableService.id}`"
            icon="i-lucide-calendar-plus"
            block
            class="sm:w-auto"
          >
            درخواست رزرو
          </UButton>
          <div class="flex gap-2">
            <UButton color="neutral" variant="outline" icon="i-lucide-message-circle" :loading="chatPending" class="flex-1 sm:flex-none" @click="startChat">
              پیام
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-heart"
              :loading="favPending"
              :aria-pressed="provider.favorited"
              class="flex-1 sm:flex-none"
              :ui="{ leadingIcon: provider.favorited ? 'fill-terracotta-500 text-terracotta-500 dark:fill-terracotta-300 dark:text-terracotta-300' : '' }"
              @click="toggleFavorite"
            >
              {{ provider.favorited ? 'ذخیره شد' : 'ذخیره' }}
            </UButton>
            <UButton color="neutral" variant="ghost" icon="i-lucide-flag" square :to="`/report?type=PROVIDER&id=${provider.id}`" aria-label="گزارش این ارائه‌دهنده" />
          </div>
        </div>
        <InlineMessage :message="actionError" class="mt-3" />
      </AppSection>

      <!-- About -->
      <AppSection v-if="provider.bio || provider.experience" title="درباره" class="mt-6">
        <p v-if="provider.bio" class="text-sm leading-8 text-default sm:text-[15px]">{{ provider.bio }}</p>
        <p v-if="provider.experience" class="mt-3 text-sm leading-7 text-toned" :class="provider.bio && 'border-t border-muted pt-3'">
          {{ provider.experience }}
        </p>
      </AppSection>

      <!-- Gallery -->
      <AppSection v-if="provider.gallery.length" title="گالری" class="mt-6">
        <ul class="grid grid-cols-3 gap-2">
          <li v-for="img in provider.gallery" :key="img.id">
            <button
              type="button"
              class="block aspect-square w-full overflow-hidden rounded-lg ring-1 ring-default focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="نمایش تصویر بزرگ"
              @click="lightbox = img.imageUrl"
            >
              <img :src="img.imageUrl" alt="" class="size-full object-cover" loading="lazy" decoding="async">
            </button>
          </li>
        </ul>
      </AppSection>

      <!-- Services -->
      <AppSection title="خدمات" :description="provider.services.length ? 'قیمت نهایی پیش از ثبت رزرو روی سرور محاسبه می‌شود.' : ''" class="mt-6" flush>
        <p v-if="!provider.services.length" class="px-4 pb-4 text-sm text-muted sm:px-5">خدمت فعالی ثبت نشده.</p>
        <ul v-else class="divide-y divide-muted border-t border-muted">
          <li v-for="svc in provider.services" :key="svc.id" class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:px-5">
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold text-primary">{{ svc.categoryName }}</p>
              <h3 class="mt-0.5 text-base font-bold text-highlighted">{{ svc.title }}</h3>
              <p v-if="svc.description" class="mt-1 text-sm leading-7 text-toned">{{ svc.description }}</p>
              <p class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span v-if="svc.durationMinutes" class="inline-flex items-center gap-1">
                  <UIcon name="i-lucide-timer" class="size-4" aria-hidden="true" />
                  <span class="num">{{ formatNumber(svc.durationMinutes) }}</span> دقیقه
                </span>
                <span class="inline-flex items-center gap-1">
                  <UIcon name="i-lucide-users" class="size-4" aria-hidden="true" />
                  ظرفیت <span class="num">{{ formatNumber(svc.capacity) }}</span>
                </span>
              </p>
            </div>
            <div class="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
              <p class="text-sm">
                <template v-if="priceLabel(svc)">
                  <span class="num text-lg font-bold text-highlighted">{{ priceLabel(svc) }}</span>
                  <span class="text-muted"> تومان · {{ PRICING_TYPE_LABELS[svc.pricingType] }}</span>
                </template>
                <span v-else class="font-semibold text-toned">{{ PRICING_TYPE_LABELS[svc.pricingType] }}</span>
              </p>
              <UButton :to="`/bookings/new?provider=${provider.id}&service=${svc.id}`" size="md" variant="soft" trailing-icon="i-lucide-chevron-left">
                رزرو
              </UButton>
            </div>
          </li>
        </ul>
      </AppSection>

      <!-- Availability -->
      <AppSection title="ساعت‌های پیش‌رو" description="به وقت تهران؛ بازه‌های رزروشده از تقویم کم می‌شوند." class="mt-6" flush>
        <ul v-if="week.length" class="divide-y divide-muted border-t border-muted text-sm">
          <li v-for="day in week" :key="day.date" class="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
            <span class="shrink-0 font-medium text-highlighted">
              {{ WEEKDAY_LABELS[day.weekday] }}
              <span class="block text-xs font-normal text-muted">{{ formatCalendarDay(day.date, { weekday: undefined }) }}</span>
            </span>
            <span v-if="day.slots.length" class="flex flex-wrap justify-end gap-1.5">
              <span v-for="s in day.slots" :key="s.startTime" class="num rounded-md bg-forest-50 px-2 py-0.5 text-xs font-medium text-forest-800 dark:text-forest-200">
                {{ s.startTime }}–{{ s.endTime }}
              </span>
            </span>
            <span v-else class="text-dimmed">تعطیل</span>
          </li>
        </ul>
        <p v-else class="px-4 pb-4 text-sm text-muted sm:px-5">ساعت کاری اعلام نشده است.</p>
      </AppSection>

      <!-- Reviews -->
      <AppSection title="نظرها" class="mt-6">
        <template v-if="provider.rating.reviewCount">
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-baseline gap-1">
              <span class="num text-4xl font-extrabold text-highlighted">{{ formatRating(provider.rating.overall) }}</span>
              <span class="text-sm text-muted">از ۵ · <span class="num">{{ formatNumber(provider.rating.reviewCount) }}</span> نظر</span>
            </div>
            <dl class="grid flex-1 grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-4">
              <div v-for="dim in ratingDimensions" :key="dim.label" class="flex items-center justify-between gap-2">
                <dt class="text-muted">{{ dim.label }}</dt>
                <dd class="num font-semibold text-highlighted">{{ formatRating(dim.value) }}</dd>
              </div>
            </dl>
          </div>
          <ul v-if="reviews.length" class="mt-5 divide-y divide-muted border-t border-muted">
            <li v-for="item in reviews" :key="item.id" class="py-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-highlighted">{{ item.ownerName }}</p>
                <span class="inline-flex items-center gap-1 text-sm font-medium">
                  <UIcon name="i-lucide-star" class="size-4 fill-terracotta-400 text-terracotta-400 dark:fill-terracotta-300 dark:text-terracotta-300" aria-hidden="true" />
                  <span class="num">{{ formatRating(item.overall) }}</span>
                </span>
              </div>
              <p class="mt-2 text-sm leading-7 text-default">{{ item.comment }}</p>
              <p class="mt-1 text-xs text-dimmed">{{ formatDate(item.createdAt) }}</p>
            </li>
          </ul>
        </template>
        <p v-else class="text-sm text-muted">هنوز نظری ثبت نشده است. نظرها فقط پس از رزرو تمام‌شده ثبت می‌شوند.</p>
      </AppSection>

      <UModal v-model:open="lightboxOpen" title="تصویر گالری" :ui="{ content: 'sm:max-w-2xl bg-ink-950' }">
        <template #content>
          <div class="relative">
            <img v-if="lightbox" :src="lightbox" alt="" class="max-h-[85dvh] w-full object-contain">
            <UButton
              color="neutral"
              variant="solid"
              icon="i-lucide-x"
              size="md"
              square
              class="absolute end-3 top-3"
              aria-label="بستن"
              @click="lightbox = null"
            />
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
