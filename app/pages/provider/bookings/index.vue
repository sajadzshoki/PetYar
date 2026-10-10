<script setup lang="ts">
import type { Booking } from '~~/shared/types/booking'
import type { BookingStatus } from '~~/shared/constants/bookings'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const items = ref<Booking[]>([])
const loading = ref(true)
const error = ref('')

type Filter = 'pending' | 'upcoming' | 'past'
const filter = ref<Filter>('pending')

const FILTERS: { key: Filter, label: string, statuses: BookingStatus[] }[] = [
  { key: 'pending', label: 'در انتظار پاسخ', statuses: ['PENDING'] },
  { key: 'upcoming', label: 'جاری', statuses: ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'DISPUTED'] },
  { key: 'past', label: 'گذشته', statuses: ['COMPLETED', 'CANCELLED', 'REJECTED'] },
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { bookings: Booking[] } }>('/api/provider/bookings')
    items.value = res.data.bookings
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

function countFor(f: Filter) {
  const statuses = FILTERS.find(x => x.key === f)!.statuses
  return items.value.filter(b => statuses.includes(b.status)).length
}

const visible = computed(() => {
  const statuses = FILTERS.find(x => x.key === filter.value)!.statuses
  return items.value
    .filter(b => statuses.includes(b.status))
    .sort((a, b) => (filter.value === 'past' ? b.startAt.localeCompare(a.startAt) : a.startAt.localeCompare(b.startAt)))
})

useHead({ title: 'درخواست‌های رزرو | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="درخواست‌های رزرو" description="به درخواست‌های جدید پاسخ دهید و رزروهای جاری را پیش ببرید." />

    <div class="mb-4 flex rounded-lg bg-canvas-deep p-1" role="tablist" aria-label="دسته‌بندی رزروها">
      <button
        v-for="f in FILTERS"
        :key="f.key"
        type="button"
        role="tab"
        :aria-selected="filter === f.key"
        class="min-h-10 flex-1 rounded-md px-1 text-sm font-semibold transition-colors"
        :class="filter === f.key ? 'bg-paper text-highlighted shadow-card' : 'text-muted hover:text-highlighted'"
        @click="filter = f.key"
      >
        {{ f.label }}
        <span v-if="countFor(f.key)" class="num ms-1 text-xs text-muted">({{ formatNumber(countFor(f.key)) }})</span>
      </button>
    </div>

    <SkeletonList v-if="loading" :rows="3" />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />
    <AppState
      v-else-if="!visible.length"
      icon="i-lucide-inbox"
      :title="filter === 'pending' ? 'درخواست بازی نیست' : filter === 'upcoming' ? 'رزرو جاری ندارید' : 'رزرو گذشته‌ای نیست'"
      :description="filter === 'pending' ? 'وقتی صاحب حیوانی درخواست رزرو بفرستد، اینجا نمایش داده می‌شود.' : ''"
    />
    <ul v-else class="grid gap-3">
      <li v-for="item in visible" :key="item.id">
        <BookingRow :booking="item" :to="`/provider/bookings/${item.id}`" perspective="provider" />
      </li>
    </ul>
  </div>
</template>
