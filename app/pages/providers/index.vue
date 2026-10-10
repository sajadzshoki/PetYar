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
}

async function nearMe() {
  geoError.value = ''
  if (!navigator.geolocation) {
    geoError.value = 'موقعیت‌یاب در این مرورگر نیست'
    return
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      lat.value = pos.coords.latitude.toFixed(5)
      lng.value = pos.coords.longitude.toFixed(5)
      if (!radiusKm.value) radiusKm.value = '15'
      sort.value = 'distance'
      page.value = 1
      pushQuery({ page: undefined, sort: 'distance' })
    },
    () => {
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

function formatPrice(value: number | null) {
  if (value == null) return null
  return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`
}

onMounted(async () => {
  const [catRes, facetRes] = await Promise.all([
    $fetch<{ data: { categories: ServiceCategory[] } }>('/api/service-categories'),
    $fetch<{ data: { facets: SearchFacets } }>('/api/discovery/facets'),
  ])
  categories.value = catRes.data.categories
  facets.value = facetRes.data.facets
})

watch(() => route.query, load, { immediate: true, deep: true })
</script>

<template>
  <div>
    <section class="border-b border-ink-200 bg-paper">
      <div class="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p class="text-sm text-forest-700">کشف خدمات</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">چه کمکی لازم دارید؟</h1>
        <p class="mt-3 max-w-md text-sm leading-7 text-ink-600">
          جستجو روی داده‌های واقعی ارائه‌دهندگان است. امتیاز و رزرو هنوز ساخته نشده.
        </p>
        <form class="mt-6 flex gap-2" @submit.prevent="submit">
          <UInput v-model="q" class="flex-1" placeholder="نام، شهر، یا نوع خدمت" />
          <UButton type="submit">جستجو</UButton>
        </form>
      </div>
    </section>

    <div class="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div class="flex gap-2 overflow-x-auto pb-2 text-sm">
        <button
          type="button"
          class="shrink-0 border-b-2 px-1 pb-1"
          :class="!category ? 'border-terracotta-500 text-ink-900' : 'border-transparent text-ink-500'"
          @click="category = ''; page = 1; pushQuery({ category: undefined, page: undefined })"
        >
          همه
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          class="shrink-0 border-b-2 px-1 pb-1"
          :class="category === cat.id ? 'border-terracotta-500 text-ink-900' : 'border-transparent text-ink-500'"
          @click="category = cat.id; page = 1; pushQuery({ page: undefined })"
        >
          {{ cat.name }}
        </button>
      </div>

      <div class="mt-5 grid gap-3 sm:grid-cols-2">
        <USelect v-model="city" :items="cityItems" class="w-full" @update:model-value="page = 1; pushQuery({ page: undefined })" />
        <USelect v-model="district" :items="districtItems" class="w-full" @update:model-value="page = 1; pushQuery({ page: undefined })" />
        <UInput v-model="priceMin" placeholder="حداقل قیمت (تومان)" dir="ltr" class="w-full" @change="submit" />
        <UInput v-model="priceMax" placeholder="حداکثر قیمت (تومان)" dir="ltr" class="w-full" @change="submit" />
        <USelect v-model="sort" :items="sortItems" class="w-full" @update:model-value="pushQuery()" />
        <div class="flex items-center gap-2">
          <UButton size="sm" color="neutral" variant="outline" @click="nearMe">نزدیک من</UButton>
          <UButton v-if="lat && lng" size="sm" color="neutral" variant="ghost" @click="clearNear">حذف موقعیت</UButton>
        </div>
      </div>
      <p v-if="geoError" class="mt-2 text-sm text-terracotta-700">{{ geoError }}</p>
      <p v-if="lat && lng" class="mt-2 text-xs text-ink-500" dir="ltr">{{ lat }}, {{ lng }} · {{ radiusKm || 15 }} km</p>

      <div class="mt-6 flex gap-4 text-sm">
        <button type="button" :class="view === 'providers' ? 'text-ink-900' : 'text-ink-500'" @click="setView('providers')">ارائه‌دهنده</button>
        <button type="button" :class="view === 'services' ? 'text-ink-900' : 'text-ink-500'" @click="setView('services')">خدمت</button>
      </div>

      <AppState v-if="loading" title="در حال جستجو…" />
      <AppState v-else-if="error" :title="error" />
      <AppState
        v-else-if="result && result.total === 0"
        title="نتیجه‌ای پیدا نشد"
        description="عبارت یا فیلترها را تغییر دهید."
      >
        <UButton color="neutral" variant="outline" @click="router.replace('/providers')">پاک کردن فیلترها</UButton>
      </AppState>

      <template v-else-if="result">
        <p class="mt-6 text-sm text-ink-500">{{ result.total }} نتیجه</p>

        <ul v-if="result.view === 'providers'" class="mt-4 divide-y divide-ink-200 border-t border-ink-200">
          <li v-for="item in providerItems" :key="item.id">
            <NuxtLink :to="`/providers/${item.id}`" class="flex gap-4 py-5">
              <div class="h-24 w-24 shrink-0 overflow-hidden bg-canvas-deep ring-1 ring-ink-200 sm:h-28 sm:w-28">
                <img v-if="item.photoUrl" :src="item.photoUrl" alt="" class="h-full w-full object-cover">
              </div>
              <div class="min-w-0">
                <h2 class="font-medium">{{ item.displayName }}</h2>
                <p v-if="item.reviewCount" class="mt-1 text-sm text-ink-700">{{ item.ratingAverage }} از ۵ · {{ item.reviewCount }} نظر</p>
                <p class="mt-1 text-sm text-ink-600">
                  {{ [item.city, item.district].filter(Boolean).join('، ') || item.serviceArea || 'محدوده اعلام نشده' }}
                </p>
                <p v-if="item.serviceTitles.length" class="mt-2 text-sm text-ink-700">{{ item.serviceTitles.join('، ') }}</p>
                <p v-if="formatPrice(item.minPrice)" class="mt-2 text-sm">از {{ formatPrice(item.minPrice) }}</p>
                <p v-if="item.distanceKm != null" class="mt-1 text-xs text-ink-500">{{ item.distanceKm.toFixed(1) }} کیلومتر</p>
              </div>
            </NuxtLink>
          </li>
        </ul>

        <ul v-else class="mt-4 divide-y divide-ink-200 border-t border-ink-200">
          <li v-for="item in serviceItems" :key="item.id">
            <NuxtLink :to="`/providers/${item.providerId}`" class="flex gap-4 py-5">
              <div class="h-20 w-20 shrink-0 overflow-hidden bg-canvas-deep ring-1 ring-ink-200">
                <img v-if="item.photoUrl" :src="item.photoUrl" alt="" class="h-full w-full object-cover">
              </div>
              <div class="min-w-0">
                <p class="text-xs text-forest-700">{{ item.categoryName }}</p>
                <h2 class="mt-1 font-medium">{{ item.title }}</h2>
                <p class="mt-1 text-sm text-ink-600">{{ item.providerName }} · {{ [item.city, item.district].filter(Boolean).join('، ') }}</p>
                <p class="mt-2 text-sm">
                  {{ formatPrice(item.price) || PRICING_TYPE_LABELS[item.pricingType] }}
                </p>
              </div>
            </NuxtLink>
          </li>
        </ul>

        <nav v-if="result.totalPages > 1" class="mt-8 flex items-center justify-between text-sm">
          <button type="button" class="text-ink-600 disabled:text-ink-300" :disabled="result.page <= 1" @click="goPage(result.page - 1)">قبلی</button>
          <span class="text-ink-500">صفحه {{ result.page }} از {{ result.totalPages }}</span>
          <button type="button" class="text-ink-600 disabled:text-ink-300" :disabled="result.page >= result.totalPages" @click="goPage(result.page + 1)">بعدی</button>
        </nav>
      </template>
    </div>
  </div>
</template>
