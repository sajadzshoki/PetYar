<script setup lang="ts">
import type { ServiceCategory } from '~~/shared/types/provider'
import type { ProviderSearchHit, SearchPage } from '~~/shared/types/search'

const { loggedIn, user } = useUserSession()
const q = ref('')

const firstName = computed(() => (user.value?.displayName || '').trim().split(/\s+/)[0] || '')

function search() {
  navigateTo({ path: '/providers', query: q.value.trim() ? { q: q.value.trim() } : undefined })
}

const {
  data: categories,
  status: categoriesStatus,
  refresh: refreshCategories,
} = useLazyAsyncData('home-categories', async () => {
  const res = await $fetch<{ data: { categories: ServiceCategory[] } }>('/api/service-categories')
  return res.data.categories
}, { default: () => [] as ServiceCategory[] })

const {
  data: newest,
  status: newestStatus,
  refresh: refreshNewest,
} = useLazyAsyncData('home-newest-providers', async () => {
  const res = await $fetch<{ data: SearchPage<ProviderSearchHit> }>('/api/providers', {
    query: { sort: 'newest', pageSize: 6 },
  })
  return res.data
}, { default: () => null as SearchPage<ProviderSearchHit> | null })

const shortcuts = [
  { to: '/pets', label: 'حیوانات من', icon: 'i-lucide-paw-print' },
  { to: '/bookings', label: 'رزروها', icon: 'i-lucide-calendar-check' },
  { to: '/inbox', label: 'پیام‌ها', icon: 'i-lucide-message-circle' },
  { to: '/favorites', label: 'ذخیره‌شده‌ها', icon: 'i-lucide-heart' },
]

const steps = [
  {
    icon: 'i-lucide-search',
    title: 'خدمت را پیدا کنید',
    body: 'بر اساس دسته، شهر، قیمت یا فاصله جستجو کنید و پرونده و ساعت‌های کاری ارائه‌دهنده را ببینید.',
  },
  {
    icon: 'i-lucide-calendar-check',
    title: 'رزرو کنید و گفتگو کنید',
    body: 'بازه آزاد را انتخاب کنید؛ مبلغ روی سرور محاسبه می‌شود و می‌توانید پیش از تأیید پیام بدهید.',
  },
  {
    icon: 'i-lucide-shield-check',
    title: 'با اطمینان بسپارید',
    body: 'پرداخت فقط از درگاه رسمی انجام می‌شود و پس از پایان خدمت می‌توانید نظر واقعی ثبت کنید.',
  },
]

const trust = [
  {
    icon: 'i-lucide-badge-check',
    title: 'نشان احراز هویت واقعی',
    body: 'نشان «احراز شده» فقط پس از بررسی مدارک توسط تیم پت‌یار نمایش داده می‌شود.',
  },
  {
    icon: 'i-lucide-star',
    title: 'نظرهای واقعی',
    body: 'هر نظر به یک رزرو تمام‌شده وصل است؛ امتیاز ساختگی وجود ندارد.',
  },
  {
    icon: 'i-lucide-lock',
    title: 'پرداخت و قیمت شفاف',
    body: 'قیمت پیش از رزرو مشخص است و پرداخت فقط از طریق درگاه بانکی ثبت می‌شود.',
  },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div class="relative mx-auto grid max-w-page items-center gap-8 px-4 pb-10 pt-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:py-20">
        <div class="max-w-xl">
          <p class="text-sm font-semibold text-primary">
            <template v-if="loggedIn && firstName">سلام {{ firstName }} 👋</template>
            <template v-else>بازار خدمات حیوانات خانگی</template>
          </p>
          <h1 class="mt-3 text-[1.9rem] font-extrabold leading-[1.3] text-highlighted sm:text-4xl lg:text-5xl lg:leading-[1.25]">
            مراقبت درست،
            <span class="text-terracotta-600">نزدیک شما</span>
          </h1>
          <p class="mt-4 text-[15px] leading-8 text-toned sm:text-base">
            ارائه‌دهندگان نگهداری، آرایش، دامپزشکی و آموزش را پیدا کنید؛ رزرو، گفتگو و پرداخت همین‌جا انجام می‌شود.
          </p>

          <form class="mt-6 flex gap-2" role="search" @submit.prevent="search">
            <UInput
              v-model="q"
              class="flex-1"
              size="xl"
              icon="i-lucide-search"
              placeholder="خدمت، نام یا شهر…"
              aria-label="جستجوی خدمت یا ارائه‌دهنده"
              :ui="{ base: 'bg-paper shadow-card' }"
            />
            <UButton type="submit" size="xl" class="shrink-0 px-5">جستجو</UButton>
          </form>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <UButton to="/providers" color="neutral" variant="outline" size="md" icon="i-lucide-list">همه ارائه‌دهندگان</UButton>
            <UButton to="/providers?sort=distance" color="neutral" variant="ghost" size="md" icon="i-lucide-locate">نزدیک من</UButton>
          </div>
        </div>

        <div class="mx-auto hidden w-full max-w-sm lg:block">
          <div class="flex aspect-square items-center justify-center rounded-[2.5rem] bg-canvas-deep">
            <img
              src="/brand/petyar-mark-512.png"
              alt="نشان پت‌یار: سگ و گربه در آغوش هم"
              width="512"
              height="512"
              class="w-3/4 select-none"
              decoding="async"
            >
          </div>
        </div>
      </div>
    </section>

    <!-- Quick shortcuts for signed-in users -->
    <section v-if="loggedIn" class="mx-auto max-w-page px-4 sm:px-6" aria-label="دسترسی سریع">
      <ul class="grid grid-cols-4 gap-2 sm:gap-3">
        <li v-for="item in shortcuts" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="pressable surface flex min-h-[4.5rem] flex-col items-center justify-center gap-2 px-1 py-3 text-center text-xs font-semibold text-highlighted transition-colors hover:border-accented sm:text-sm"
          >
            <UIcon :name="item.icon" class="size-5 text-primary" aria-hidden="true" />
            <span class="truncate">{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- Categories -->
    <section class="mx-auto max-w-page px-4 py-10 sm:px-6 lg:py-14" aria-labelledby="home-categories">
      <div class="flex items-end justify-between gap-4">
        <div>
          <h2 id="home-categories" class="text-xl font-bold sm:text-2xl">دسته‌های خدمات</h2>
          <p class="mt-1 text-sm text-muted">چه کمکی لازم دارید؟</p>
        </div>
        <NuxtLink to="/providers" class="shrink-0 text-sm font-medium text-primary hover:underline">همه</NuxtLink>
      </div>

      <div v-if="categoriesStatus === 'pending' && !categories.length" class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4" role="status" aria-busy="true">
        <div v-for="n in 8" :key="n" class="skeleton h-24 rounded-xl" />
      </div>
      <AppState
        v-else-if="categoriesStatus === 'error' && !categories.length"
        variant="error"
        compact
        title="دسته‌ها بارگذاری نشد"
        retry
        @retry="refreshCategories()"
      />
      <ul v-else class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <li v-for="cat in categories" :key="cat.id">
          <NuxtLink
            :to="{ path: '/providers', query: { category: cat.id } }"
            class="pressable surface group flex h-full items-center gap-3 p-3.5 transition-colors hover:border-forest-300 sm:flex-col sm:items-start sm:p-5"
          >
            <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-primary transition-colors group-hover:bg-forest-100">
              <UIcon :name="categoryIcon(cat.slug)" class="size-6" aria-hidden="true" />
            </span>
            <span class="text-sm font-semibold text-highlighted sm:text-base">{{ cat.name }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- Newest providers -->
    <section class="border-y border-default bg-paper" aria-labelledby="home-providers">
      <div class="mx-auto max-w-page px-4 py-10 sm:px-6 lg:py-14">
        <div class="flex items-end justify-between gap-4">
          <div>
            <h2 id="home-providers" class="text-xl font-bold sm:text-2xl">تازه‌ترین ارائه‌دهندگان</h2>
            <p class="mt-1 text-sm text-muted">پرونده‌های فعال؛ امتیاز فقط با نظر واقعی نمایش داده می‌شود.</p>
          </div>
          <NuxtLink to="/providers" class="shrink-0 text-sm font-medium text-primary hover:underline">مشاهده همه</NuxtLink>
        </div>

        <div v-if="newestStatus === 'pending' && !newest" class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-busy="true">
          <div v-for="n in 3" :key="n" class="skeleton h-28 rounded-xl" />
        </div>
        <AppState
          v-else-if="newestStatus === 'error' && !newest"
          variant="error"
          compact
          title="فهرست ارائه‌دهندگان در دسترس نیست"
          description="اتصال را بررسی کنید و دوباره تلاش کنید."
          retry
          @retry="refreshNewest()"
        />
        <AppState
          v-else-if="newest && newest.items.length === 0"
          compact
          icon="i-lucide-store"
          title="هنوز ارائه‌دهنده‌ای ثبت نشده"
          description="اولین نفر باشید؛ ساخت پرونده چند دقیقه بیشتر طول نمی‌کشد."
        >
          <UButton :to="loggedIn ? '/provider/profile' : '/register'" color="neutral" variant="outline" size="md">ارائه‌دهنده شوید</UButton>
        </AppState>
        <ul v-else-if="newest" class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="item in newest.items" :key="item.id">
            <ProviderCard :item="item" />
          </li>
        </ul>
      </div>
    </section>

    <!-- How it works -->
    <section id="how" class="mx-auto max-w-page scroll-mt-20 px-4 py-10 sm:px-6 lg:py-14" aria-labelledby="home-how">
      <h2 id="home-how" class="text-xl font-bold sm:text-2xl">سه قدم ساده</h2>
      <ol class="mt-6 grid gap-4 sm:grid-cols-3">
        <li v-for="(step, i) in steps" :key="step.title" class="surface relative p-5">
          <span class="num absolute end-4 top-4 text-xs font-bold text-terracotta-500">{{ formatNumber(i + 1).padStart(2, '۰') }}</span>
          <span class="flex size-11 items-center justify-center rounded-xl bg-canvas-deep text-highlighted">
            <UIcon :name="step.icon" class="size-5" aria-hidden="true" />
          </span>
          <h3 class="mt-4 text-base font-bold">{{ step.title }}</h3>
          <p class="mt-2 text-sm leading-7 text-muted">{{ step.body }}</p>
        </li>
      </ol>
    </section>

    <!-- Trust -->
    <section class="border-t border-default bg-forest-800 text-white" aria-labelledby="home-trust">
      <div class="mx-auto grid max-w-page gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_2fr] lg:gap-12 lg:py-16">
        <div>
          <h2 id="home-trust" class="text-xl font-bold text-white sm:text-2xl">اعتماد، اصل ماجراست</h2>
          <p class="mt-3 text-sm leading-7 text-forest-100">
            نقش‌ها مشخص‌اند — صاحب حیوان، ارائه‌دهنده و مدیر — و هر نشان و امتیازی که می‌بینید پشتوانه‌ای واقعی دارد.
          </p>
          <UButton
            :to="loggedIn ? '/providers' : '/register'"
            color="neutral"
            variant="solid"
            size="md"
            class="mt-6 bg-white text-forest-800 hover:bg-forest-50"
          >
            {{ loggedIn ? 'شروع جستجو' : 'ساخت حساب رایگان' }}
          </UButton>
        </div>
        <ul class="grid gap-4 sm:grid-cols-3">
          <li v-for="item in trust" :key="item.title" class="rounded-xl border border-white/15 bg-white/5 p-5">
            <UIcon :name="item.icon" class="size-6 text-forest-200" aria-hidden="true" />
            <h3 class="mt-3 text-base font-bold text-white">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-7 text-forest-100">{{ item.body }}</p>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
