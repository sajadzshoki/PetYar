<script setup lang="ts">
import type { AvailabilityException, AvailabilityRule, CalendarDay } from '~~/shared/types/availability'
import { WEEKDAY_LABELS, WEEKDAY_ORDER, type Weekday } from '~~/shared/constants/availability'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const rules = ref<AvailabilityRule[]>([])
const exceptions = ref<AvailabilityException[]>([])
const days = ref<CalendarDay[]>([])
const loading = ref(true)
const error = ref('')
const ok = ref('')

const ruleForm = reactive({
  weekday: 6 as Weekday,
  startTime: '09:00',
  endTime: '17:00',
  isActive: true,
})
const exceptionForm = reactive({
  date: '',
  kind: 'BLOCK' as 'BLOCK' | 'OPEN',
  startTime: '',
  endTime: '',
  note: '',
})

const weekdayItems = WEEKDAY_ORDER.map(value => ({ label: WEEKDAY_LABELS[value], value }))
const cursor = ref(new Date())

const monthLabel = computed(() => cursor.value.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' }))

function ymd(date: Date) {
  return date.toISOString().slice(0, 10)
}

function monthRange(base: Date) {
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1))
  const end = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0))
  return { from: ymd(start), to: ymd(end) }
}

async function load() {
  loading.value = true
  error.value = ''
  const { from, to } = monthRange(cursor.value)
  try {
    const [r, e, c] = await Promise.all([
      $fetch<{ data: { rules: AvailabilityRule[] } }>('/api/provider/availability/rules'),
      $fetch<{ data: { exceptions: AvailabilityException[] } }>('/api/provider/availability/exceptions', { query: { from, to } }),
      $fetch<{ data: { days: CalendarDay[] } }>('/api/provider/availability/calendar', { query: { from, to } }),
    ])
    rules.value = r.data.rules
    exceptions.value = e.data.exceptions
    days.value = c.data.days
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری برنامه ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

function rulesFor(day: Weekday) {
  return rules.value.filter(r => r.weekday === day)
}

async function addRule() {
  error.value = ''
  ok.value = ''
  try {
    await $fetch('/api/provider/availability/rules', { method: 'POST', body: { ...ruleForm } })
    ok.value = 'ساعت کاری ذخیره شد'
    await load()
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'ثبت ساعت کاری ناموفق بود')
  }
}

async function toggleRule(rule: AvailabilityRule) {
  error.value = ''
  try {
    await $fetch(`/api/provider/availability/rules/${rule.id}`, {
      method: 'PATCH',
      body: {
        weekday: rule.weekday,
        startTime: rule.startTime,
        endTime: rule.endTime,
        isActive: !rule.isActive,
      },
    })
    await load()
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'به‌روزرسانی ناموفق بود')
  }
}

async function removeRule(id: string) {
  if (!confirm('این بازه حذف شود؟')) return
  await $fetch(`/api/provider/availability/rules/${id}`, { method: 'DELETE' })
  await load()
}

async function addException() {
  error.value = ''
  ok.value = ''
  try {
    await $fetch('/api/provider/availability/exceptions', {
      method: 'POST',
      body: {
        date: exceptionForm.date,
        kind: exceptionForm.kind,
        startTime: exceptionForm.startTime || null,
        endTime: exceptionForm.endTime || null,
        note: exceptionForm.note,
      },
    })
    exceptionForm.note = ''
    ok.value = 'استثنا ذخیره شد'
    await load()
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'ثبت استثنا ناموفق بود')
  }
}

async function removeException(id: string) {
  await $fetch(`/api/provider/availability/exceptions/${id}`, { method: 'DELETE' })
  await load()
}

function shiftMonth(delta: number) {
  cursor.value = new Date(Date.UTC(cursor.value.getUTCFullYear(), cursor.value.getUTCMonth() + delta, 1))
  load()
}

function dayMeta(date: string) {
  return days.value.find(d => d.date === date)
}

const monthCells = computed(() => {
  const { from, to } = monthRange(cursor.value)
  const first = new Date(`${from}T12:00:00Z`)
  const pad = (first.getUTCDay() + 1) % 7
  const cells: (string | null)[] = Array.from({ length: pad }, () => null)
  let d = from
  while (d <= to) {
    cells.push(d)
    const next = new Date(`${d}T12:00:00Z`)
    next.setUTCDate(next.getUTCDate() + 1)
    d = next.toISOString().slice(0, 10)
  }
  return cells
})

watch(cursor, load, { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-12">
    <NuxtLink to="/provider" class="text-sm text-ink-600">پرونده ارائه‌دهنده</NuxtLink>
    <h1 class="mt-3 text-2xl font-semibold">ساعت کاری و تقویم</h1>
    <p class="mt-2 text-sm leading-7 text-ink-600">
      زمان‌ها به وقت تهران است. رزرو هنوز تداخل ایجاد نمی‌کند؛ محاسبه آمادگی آن را دارد.
    </p>

    <p v-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
    <p v-if="ok" class="mt-4 text-sm text-forest-700">{{ ok }}</p>
    <AppState v-if="loading && !rules.length" title="در حال بارگذاری…" />

    <section class="mt-10">
      <h2 class="text-lg font-medium">هفته‌های تکرارشونده</h2>
      <form class="mt-4 grid gap-3 sm:grid-cols-2" @submit.prevent="addRule">
        <USelect v-model="ruleForm.weekday" :items="weekdayItems" class="w-full" />
        <div class="grid grid-cols-2 gap-2">
          <UInput v-model="ruleForm.startTime" type="time" dir="ltr" />
          <UInput v-model="ruleForm.endTime" type="time" dir="ltr" />
        </div>
        <UCheckbox v-model="ruleForm.isActive" label="فعال" />
        <UButton type="submit" size="sm">افزودن بازه</UButton>
      </form>

      <div class="mt-6 space-y-5">
        <div v-for="day in WEEKDAY_ORDER" :key="day">
          <p class="text-sm font-medium">{{ WEEKDAY_LABELS[day] }}</p>
          <ul v-if="rulesFor(day).length" class="mt-2 space-y-2 text-sm">
            <li v-for="rule in rulesFor(day)" :key="rule.id" class="flex items-center justify-between gap-3 border-b border-ink-100 py-2">
              <span :class="rule.isActive ? 'text-ink-800' : 'text-ink-400'">
                {{ rule.startTime }} – {{ rule.endTime }}
                <span v-if="!rule.isActive" class="mr-2 text-xs">غیرفعال</span>
              </span>
              <span class="flex gap-3">
                <button type="button" class="text-ink-600" @click="toggleRule(rule)">{{ rule.isActive ? 'غیرفعال' : 'فعال' }}</button>
                <button type="button" class="text-ink-500" @click="removeRule(rule.id)">حذف</button>
              </span>
            </li>
          </ul>
          <p v-else class="mt-1 text-sm text-ink-400">تعطیل</p>
        </div>
      </div>
    </section>

    <section class="mt-12 border-t border-ink-200 pt-8">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-medium">{{ monthLabel }}</h2>
        <div class="flex gap-3 text-sm">
          <button type="button" @click="shiftMonth(-1)">ماه قبل</button>
          <button type="button" @click="shiftMonth(1)">ماه بعد</button>
        </div>
      </div>
      <div class="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-ink-500">
        <span v-for="d in WEEKDAY_ORDER" :key="d">{{ WEEKDAY_LABELS[d] }}</span>
      </div>
      <div class="mt-1 grid grid-cols-7 gap-1">
        <div
          v-for="(cell, i) in monthCells"
          :key="i"
          class="min-h-16 border border-ink-100 p-1 text-xs"
          :class="cell && dayMeta(cell)?.blocked ? 'bg-canvas-deep text-ink-400' : 'bg-paper'"
        >
          <template v-if="cell">
            <p>{{ Number(cell.slice(8)) }}</p>
            <p v-for="slot in dayMeta(cell)?.slots.slice(0, 2)" :key="slot.startTime" class="mt-0.5 text-[10px] text-forest-800">
              {{ slot.startTime }}–{{ slot.endTime }}
            </p>
          </template>
        </div>
      </div>
    </section>

    <section class="mt-12 border-t border-ink-200 pt-8">
      <h2 class="text-lg font-medium">استثنا و روزهای مسدود</h2>
      <form class="mt-4 space-y-3" @submit.prevent="addException">
        <UInput v-model="exceptionForm.date" type="date" dir="ltr" class="w-full" />
        <div class="flex gap-4 text-sm">
          <label><input v-model="exceptionForm.kind" type="radio" value="BLOCK" class="ml-1"> مسدودی</label>
          <label><input v-model="exceptionForm.kind" type="radio" value="OPEN" class="ml-1"> ساعت اضافه</label>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <UInput v-model="exceptionForm.startTime" type="time" dir="ltr" />
          <UInput v-model="exceptionForm.endTime" type="time" dir="ltr" />
        </div>
        <UInput v-model="exceptionForm.note" placeholder="یادداشت (اختیاری)" class="w-full" />
        <UButton type="submit" size="sm" color="neutral" variant="outline">ثبت استثنا</UButton>
      </form>
      <ul class="mt-6 divide-y divide-ink-200 text-sm">
        <li v-for="item in exceptions" :key="item.id" class="flex justify-between gap-3 py-3">
          <div>
            <p>{{ item.date }} · {{ item.kind === 'BLOCK' ? 'مسدودی' : 'ساعت اضافه' }}</p>
            <p class="text-ink-600">
              {{ item.startTime && item.endTime ? `${item.startTime} – ${item.endTime}` : 'تمام روز' }}
              <span v-if="item.note"> · {{ item.note }}</span>
            </p>
          </div>
          <button type="button" class="text-ink-500" @click="removeException(item.id)">حذف</button>
        </li>
      </ul>
      <p v-if="!exceptions.length" class="mt-3 text-sm text-ink-500">استثنایی در این ماه نیست.</p>
    </section>
  </div>
</template>
