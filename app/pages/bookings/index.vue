<script setup lang="ts">
import type { Booking } from '~~/shared/types/booking'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const items = ref<Booking[]>([])
const loading = ref(true)
const error = ref('')
const tab = ref<'active' | 'past'>('active')

const ACTIVE = ['PENDING', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'DISPUTED']

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { bookings: Booking[] } }>('/api/bookings')
    items.value = res.data.bookings
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری رزروها ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

const active = computed(() => items.value.filter(b => ACTIVE.includes(b.status)))
const past = computed(() => items.value.filter(b => !ACTIVE.includes(b.status)))
const visible = computed(() => (tab.value === 'active' ? active.value : past.value))
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="رزروهای من" description="وضعیت هر رزرو و پرداخت آن را اینجا دنبال کنید.">
      <template #actions>
        <UButton to="/providers" size="md" color="neutral" variant="outline" icon="i-lucide-search">رزرو جدید</UButton>
      </template>
    </PageHeader>

    <div class="mb-4 flex rounded-lg bg-canvas-deep p-1" role="tablist" aria-label="دسته‌بندی رزروها">
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'active'"
        class="min-h-10 flex-1 rounded-md text-sm font-semibold transition-colors"
        :class="tab === 'active' ? 'bg-paper text-highlighted shadow-card' : 'text-muted hover:text-highlighted'"
        @click="tab = 'active'"
      >
        جاری
        <span v-if="active.length" class="num ms-1 text-xs text-muted">({{ formatNumber(active.length) }})</span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'past'"
        class="min-h-10 flex-1 rounded-md text-sm font-semibold transition-colors"
        :class="tab === 'past' ? 'bg-paper text-highlighted shadow-card' : 'text-muted hover:text-highlighted'"
        @click="tab = 'past'"
      >
        گذشته
        <span v-if="past.length" class="num ms-1 text-xs text-muted">({{ formatNumber(past.length) }})</span>
      </button>
    </div>

    <SkeletonList v-if="loading" :rows="3" />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />
    <AppState
      v-else-if="!visible.length"
      icon="i-lucide-calendar-check"
      :title="tab === 'active' ? 'رزرو جاری ندارید' : 'رزرو گذشته‌ای نیست'"
      :description="tab === 'active' ? 'ارائه‌دهنده مناسب را پیدا کنید و اولین رزروتان را ثبت کنید.' : 'رزروهای تمام‌شده، لغوشده یا ردشده اینجا نمایش داده می‌شوند.'"
    >
      <UButton v-if="tab === 'active'" to="/providers" icon="i-lucide-search">جستجوی ارائه‌دهنده</UButton>
    </AppState>
    <ul v-else class="grid gap-3">
      <li v-for="item in visible" :key="item.id">
        <BookingRow :booking="item" :to="`/bookings/${item.id}`" perspective="owner" />
      </li>
    </ul>
  </div>
</template>
