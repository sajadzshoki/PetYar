<script setup lang="ts">
import type { ServiceCategory } from '~~/shared/types/provider'
import type { ProviderSearchHit, SearchFacets, SearchPage, ServiceSearchHit } from '~~/shared/types/search'
import { SEARCH_SORT_LABELS, SEARCH_SORTS, type SearchSort } from '~~/shared/constants/search'
import { PRICING_TYPE_LABELS } from '~~/shared/constants/providers'
import { apiErrorMessage } from '~/utils/api-error'

const route = useRoute()
const router = useRouter()

const q = ref('')
const category = ref('')
const city = ref('')
const district = ref('')
const priceMin = ref('')
const priceMax = ref('')
const view = ref<'providers' | 'services'>('providers')
const sort = ref<SearchSort>('newest')
const page = ref(1)
const lat = ref('')
const lng = ref('')
const radiusKm = ref('')

const categories = ref<ServiceCategory[]>([])
const facets = ref<SearchFacets>({ cities: [], districts: [] })
const result = ref<SearchPage<ProviderSearchHit> | SearchPage<ServiceSearchHit> | null>(null)
const loading = ref(true)
const error = ref('')
const geoError = ref('')
const geoPending = ref(false)
const filtersOpen = ref(false)

const sortItems = SEARCH_SORTS.map(value => ({ label: SEARCH_SORT_LABELS[value], value }))
const cityItems = computed(() => [
  { label: 'همه شهرها', value: '' },
  ...facets.value.cities.map(c => ({ label: c, value: c })),
])
const districtItems = computed(() => [
  { label: 'همه محله‌ها', value: '' },
  ...facets.value.districts.map(d => ({ label: d, value: d })),
])

const providerItems = computed(() => (result.value?.view === 'providers' ? result.value.items as ProviderSearchHit[] : []))
const serviceItems = computed(() => (result.value?.view === 'services' ? result.value.items as ServiceSearchHit[] : []))

const activeCategory = computed(() => categories.value.find(c => c.id === category.value) || null)
const hasLocation = computed(() => Boolean(lat.value && lng.value))
const activeFilterCount = computed(() =>
  [city.value, district.value, priceMin.value, priceMax.value, sort.value !== 'newest' ? sort.value : ''].filter(Boolean).length,
)
const hasAnyFilter = computed(() => activeFilterCount.value > 0 || Boolean(q.value || category.value || hasLocation.value))

function readRoute() {
  q.value = String(route.query.q || '')
  category.value = String(route.query.category || '')
  city.value = String(route.query.city || '')
  district.value = String(route.query.district || '')
  priceMin.value = String(route.query.priceMin || '')
  priceMax.value = String(route.query.priceMax || '')
  view.value = route.query.view === 'services' ? 'services' : 'providers'
  sort.value = typeof route.query.sort === 'string' && (SEARCH_SORTS as readonly string[]).includes(route.query.sort)
    ? route.query.sort as SearchSort
    : 'newest'
  page.value = Number(route.query.page || 1) || 1
  lat.value = String(route.query.lat || '')
  lng.value = String(route.query.lng || '')
  radiusKm.value = String(route.query.radiusKm || '')
}

function toQuery(overrides: Record<string, string | number | undefined> = {}) {
  const raw: Record<string, string | number | undefined> = {
    q: q.value.trim() || undefined,
    category: category.value || undefined,
    city: city.value || undefined,
    district: district.value || undefined,
    priceMin: priceMin.value || undefined,
    priceMax: priceMax.value || undefined,
    view: view.value === 'services' ? 'services' : undefined,
    sort: sort.value !== 'newest' ? sort.value : undefined,
    page: page.value > 1 ? page.value : undefined,
    lat: lat.value || undefined,
    lng: lng.value || undefined,
    radiusKm: radiusKm.value || undefined,
    ...overrides,
  }
  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (value !== undefined && value !== '') query[key] = String(value)
  }
  return query
}

function pushQuery(overrides: Record<string, string | number | undefined> = {}) {
  return router.replace({ path: '/providers', query: toQuery(overrides) })
}

async function load() {
  readRoute()
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: SearchPage<ProviderSearchHit> | SearchPage<ServiceSearchHit> }>('/api/providers', {
      query: toQuery(),
    })
    result.value = res.data
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'جستجو ناموفق بود')
    result.value = null
  }
  finally {
    loading.value = false
  }
}

function submit() {
  page.value = 1
  pushQuery({ page: undefined })
}

function applyFilters() {
  filtersOpen.value = false
  submit()
}

function resetFilters() {
  city.value = ''
  district.value = ''
  priceMin.value = ''
  priceMax.value = ''
  sort.value = hasLocation.value ? 'distance' : 'newest'
  applyFilters()
}

function setCategory(id: string) {
  category.value = id
  page.value = 1
  pushQuery({ category: id || undefined, page: undefined })
}

function setView(next: 'providers' | 'services') {
  view.value = next
  page.value = 1
  pushQuery({ view: next === 'services' ? 'services' : undefined, page: undefined })
}

function goPage(next: number) {
  if (!result.value) return
  if (next < 1 || next > result.value.totalPages) return
  page.value = next
  pushQuery({ page: next > 1 ? next : undefined })
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

function nearMe() {
  geoError.value = ''
  if (!navigator.geolocation) {
    geoError.value = 'موقعیت‌یاب در این مرورگر در دسترس نیست'
    return
  }
  geoPending.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      geoPending.value = false
      lat.value = pos.coords.latitude.toFixed(5)
      lng.value = pos.coords.longitude.toFixed(5)
      if (!radiusKm.value) radiusKm.value = '15'
      sort.value = 'distance'
      page.value = 1
      pushQuery({ page: undefined, sort: 'distance' })
    },
    () => {
      geoPending.value = false
      geoError.value = 'اجازه دسترسی به موقعیت داده نشد'
    },
    { timeout: 8000 },
  )
}

function clearNear() {
  lat.value = ''
  lng.value = ''
  radiusKm.value = ''
  if (sort.value === 'distance') sort.value = 'newest'
  page.value = 1
  pushQuery({ lat: undefined, lng: undefined, radiusKm: undefined, page: undefined })
}

function clearAll() {
  router.replace('/providers')
}

onMounted(async () => {
  const [catRes, facetRes] = await Promise.allSettled([
    $fetch<{ data: { categories: ServiceCategory[] } }>('/api/service-categories'),
    $fetch<{ data: { facets: SearchFacets } }>('/api/discovery/facets'),
  ])
  if (catRes.status === 'fulfilled') categories.value = catRes.value.data.categories
  if (facetRes.status === 'fulfilled') facets.value = facetRes.value.data.facets
})

watch(() => route.query, load, { immediate: true, deep: true })

useHead({ title: 'جستجوی ارائه‌دهندگان | پت‌یار' })
</script>

<template>
  <div>
    <!-- Search bar -->
    <section class="border-b border-default bg-paper">
      <div class="mx-auto max-w-content px-4 pb-4 pt-5 sm:px-6 sm:pt-8">
        <h1 class="text-xl sm:text-2xl">چه کمکی لازم دارید؟</h1>
        <form class="mt-3 flex gap-2" role="search" @submit.prevent="submit">
          <UInput
            v-model="q"
            class="flex-1"
            icon="i-lucide-search"
            placeholder="نام، شهر یا نوع خدمت"
            aria-label="جستجو"
            :ui="{ trailing: 'pe-1' }"
          >
            <template v-if="q" #trailing>
              <UButton color="neutral" variant="link" size="sm" icon="i-lucide-x" aria-label="پاک کردن جستجو" @click="q = ''; submit()" />
            </template>
          </UInput>
          <UButton type="submit" class="shrink-0" icon="i-lucide-search" aria-label="جستجو">
            <span class="hidden sm:inline">جستجو</span>
          </UButton>
        </form>

        <!-- Category chips -->
        <div class="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:-mx-6 sm:px-6" role="tablist" aria-label="دسته‌ها">
          <button
            type="button"
            role="tab"
            :aria-selected="!category"
            class="flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors"
            :class="!category ? 'border-primary bg-forest-50 text-primary' : 'border-default bg-paper text-toned hover:border-accented'"
            @click="setCategory('')"
          >
            همه
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            type="button"
            role="tab"
            :aria-selected="category === cat.id"
            class="flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors"
            :class="category === cat.id ? 'border-primary bg-forest-50 text-primary' : 'border-default bg-paper text-toned hover:border-accented'"
            @click="setCategory(cat.id)"
          >
            <UIcon :name="categoryIcon(cat.slug)" class="size-4" aria-hidden="true" />
            {{ cat.name }}
          </button>
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-content px-4 py-4 sm:px-6 sm:py-6">
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex rounded-lg bg-canvas-deep p-1" role="tablist" aria-label="نوع نتیجه">
          <button
            type="button"
            role="tab"
            :aria-selected="view === 'providers'"
            class="min-h-9 rounded-md px-3.5 text-sm font-semibold transition-colors"
            :class="view === 'providers' ? 'bg-paper text-highlighted shadow-card' : 'text-muted hover:text-highlighted'"
            @click="setView('providers')"
          >
            ارائه‌دهنده
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="view === 'services'"
            class="min-h-9 rounded-md px-3.5 text-sm font-semibold transition-colors"
            :class="view === 'services' ? 'bg-paper text-highlighted shadow-card' : 'text-muted hover:text-highlighted'"
            @click="setView('services')"
          >
            خدمت
          </button>
        </div>

        <div class="ms-auto flex items-center gap-2">
          <UButton
            v-if="!hasLocation"
            size="md"
            color="neutral"
            variant="outline"
            icon="i-lucide-locate"
            :loading="geoPending"
            @click="nearMe"
          >
            نزدیک من
          </UButton>
          <UButton
            v-else
            size="md"
            color="primary"
            variant="soft"
            icon="i-lucide-locate"
            trailing-icon="i-lucide-x"
            aria-label="حذف فیلتر موقعیت"
            @click="clearNear"
          >
            نزدیک من · <span class="num">{{ formatNumber(radiusKm || 15) }}</span> کیلومتر
          </UButton>
          <UButton size="md" color="neutral" variant="outline" icon="i-lucide-sliders-horizontal" @click="filtersOpen = true">
            فیلترها
            <UBadge v-if="activeFilterCount" color="primary" size="sm" class="num rounded-full">{{ formatNumber(activeFilterCount) }}</UBadge>
          </UButton>
        </div>
      </div>
      <InlineMessage :message="geoError" kind="warning" class="mt-3" />

      <!-- Results -->
      <div class="mt-4">
        <SkeletonList v-if="loading" :rows="4" />
        <AppState v-else-if="error" variant="error" :title="error" description="اتصال را بررسی کنید و دوباره تلاش کنید." retry @retry="load" />
        <AppState
          v-else-if="result && result.total === 0"
          icon="i-lucide-search-x"
          title="نتیجه‌ای پیدا نشد"
          :description="hasAnyFilter ? 'عبارت یا فیلترها را تغییر دهید.' : 'هنوز ارائه‌دهنده فعالی ثبت نشده است.'"
        >
          <UButton v-if="hasAnyFilter" color="neutral" variant="outline" size="md" icon="i-lucide-x" @click="clearAll">پاک کردن فیلترها</UButton>
        </AppState>

        <template v-else-if="result">
          <p class="mb-3 text-sm text-muted" aria-live="polite">
            <span class="num">{{ formatNumber(result.total) }}</span>
            {{ result.view === 'providers' ? 'ارائه‌دهنده' : 'خدمت' }}
            <template v-if="activeCategory"> در «{{ activeCategory.name }}»</template>
          </p>

          <ul v-if="result.view === 'providers'" class="grid gap-3">
            <li v-for="item in providerItems" :key="item.id">
              <ProviderCard :item="item" />
            </li>
          </ul>

          <ul v-else class="grid gap-3">
            <li v-for="item in serviceItems" :key="item.id">
              <NuxtLink
                :to="`/providers/${item.providerId}`"
                class="pressable surface group flex gap-3.5 p-3.5 transition-colors hover:border-forest-300 sm:p-4"
              >
                <MediaThumb :src="item.photoUrl" :initial="initialOf(item.providerName)" size-class="size-16 sm:size-20" rounded="xl" />
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold text-primary">{{ item.categoryName }}</p>
                  <h2 class="mt-0.5 truncate text-base font-bold text-highlighted">{{ item.title }}</h2>
                  <p class="mt-0.5 truncate text-sm text-muted">
                    {{ item.providerName }}<template v-if="item.city || item.district"> · {{ [item.city, item.district].filter(Boolean).join('، ') }}</template>
                  </p>
                  <p class="mt-2 text-sm">
                    <span v-if="item.price != null" class="font-semibold text-highlighted">
                      <span class="num">{{ formatNumber(item.price) }}</span> تومان
                      <span class="font-normal text-muted">· {{ PRICING_TYPE_LABELS[item.pricingType] }}</span>
                    </span>
                    <span v-else class="font-medium text-toned">{{ PRICING_TYPE_LABELS[item.pricingType] }}</span>
                    <span v-if="item.durationMinutes" class="text-muted"> · <span class="num">{{ formatNumber(item.durationMinutes) }}</span> دقیقه</span>
                  </p>
                </div>
                <UIcon name="i-lucide-chevron-left" class="mt-1 size-4 shrink-0 text-ink-300 transition-colors group-hover:text-ink-500" aria-hidden="true" />
              </NuxtLink>
            </li>
          </ul>

          <nav v-if="result.totalPages > 1" class="mt-6 flex items-center justify-between gap-3" aria-label="صفحه‌بندی">
            <UButton
              color="neutral"
              variant="outline"
              size="md"
              icon="i-lucide-chevron-right"
              :disabled="result.page <= 1"
              @click="goPage(result.page - 1)"
            >
              قبلی
            </UButton>
            <span class="text-sm text-muted">
              صفحه <span class="num">{{ formatNumber(result.page) }}</span> از <span class="num">{{ formatNumber(result.totalPages) }}</span>
            </span>
            <UButton
              color="neutral"
              variant="outline"
              size="md"
              trailing-icon="i-lucide-chevron-left"
              :disabled="result.page >= result.totalPages"
              @click="goPage(result.page + 1)"
            >
              بعدی
            </UButton>
          </nav>
        </template>
      </div>
    </div>

    <!-- Filters sheet -->
    <USlideover
      v-model:open="filtersOpen"
      title="فیلترها"
      description="نتایج را دقیق‌تر کنید"
      side="bottom"
      :ui="{ content: 'max-h-[90dvh] rounded-t-2xl sm:max-w-content sm:mx-auto', body: 'pb-safe' }"
    >
      <template #body>
        <form class="space-y-5" @submit.prevent="applyFilters">
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="شهر">
              <USelect v-model="city" :items="cityItems" class="w-full" />
            </UFormField>
            <UFormField label="محله">
              <USelect v-model="district" :items="districtItems" class="w-full" />
            </UFormField>
            <UFormField label="حداقل قیمت (تومان)">
              <UInput v-model="priceMin" type="number" min="0" inputmode="numeric" dir="ltr" class="w-full" placeholder="0" />
            </UFormField>
            <UFormField label="حداکثر قیمت (تومان)">
              <UInput v-model="priceMax" type="number" min="0" inputmode="numeric" dir="ltr" class="w-full" placeholder="1,000,000" />
            </UFormField>
            <UFormField label="مرتب‌سازی" class="sm:col-span-2">
              <USelect v-model="sort" :items="sortItems" class="w-full" />
            </UFormField>
          </div>
          <div class="flex items-center justify-between gap-2 pt-1">
            <UButton type="button" color="neutral" variant="ghost" icon="i-lucide-x" @click="resetFilters">حذف فیلترها</UButton>
            <UButton type="submit" icon="i-lucide-check">اعمال</UButton>
          </div>
        </form>
      </template>
    </USlideover>
  </div>
</template>
