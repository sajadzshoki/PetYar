<script setup lang="ts">
import type { AvailabilityException, AvailabilityRule, CalendarDay } from '~~/shared/types/availability'
import { WEEKDAY_LABELS, WEEKDAY_ORDER, type Weekday } from '~~/shared/constants/availability'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const toast = useToast()
const rules = ref<AvailabilityRule[]>([])
const exceptions = ref<AvailabilityException[]>([])
const days = ref<CalendarDay[]>([])
const loading = ref(true)
const error = ref('')
const rulePending = ref(false)
const exceptionPending = ref(false)
const busyId = ref<string | null>(null)
const ruleToDelete = ref<AvailabilityRule | null>(null)
const ruleSheet = ref(false)
const exceptionSheet = ref(false)

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
const todayKey = new Date().toISOString().slice(0, 10)

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

function fail(err: unknown, fallback: string) {
  toast.add({ title: apiErrorMessage(err, fallback), color: 'error', icon: 'i-lucide-circle-alert' })
}

async function addRule() {
  rulePending.value = true
  try {
    await $fetch('/api/provider/availability/rules', { method: 'POST', body: { ...ruleForm } })
    toast.add({ title: 'ساعت کاری ذخیره شد', icon: 'i-lucide-check', color: 'success' })
    ruleSheet.value = false
    await load()
  }
  catch (err) {
    fail(err, 'ثبت ساعت کاری ناموفق بود')
  }
  finally {
    rulePending.value = false
  }
}

async function toggleRule(rule: AvailabilityRule) {
  busyId.value = rule.id
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
    fail(err, 'به‌روزرسانی ناموفق بود')
  }
  finally {
    busyId.value = null
  }
}

async function removeRule() {
  if (!ruleToDelete.value) return
  busyId.value = ruleToDelete.value.id
  try {
    await $fetch(`/api/provider/availability/rules/${ruleToDelete.value.id}`, { method: 'DELETE' })
    ruleToDelete.value = null
    await load()
  }
  catch (err) {
    fail(err, 'حذف ناموفق بود')
  }
  finally {
    busyId.value = null
  }
}

async function addException() {
  exceptionPending.value = true
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
    toast.add({ title: 'استثنا ذخیره شد', icon: 'i-lucide-check', color: 'success' })
    exceptionSheet.value = false
    await load()
  }
  catch (err) {
    fail(err, 'ثبت استثنا ناموفق بود')
  }
  finally {
    exceptionPending.value = false
  }
}

async function removeException(id: string) {
  busyId.value = id
  try {
    await $fetch(`/api/provider/availability/exceptions/${id}`, { method: 'DELETE' })
    await load()
  }
  catch (err) {
    fail(err, 'حذف ناموفق بود')
  }
  finally {
    busyId.value = null
  }
}

function shiftMonth(delta: number) {
  cursor.value = new Date(Date.UTC(cursor.value.getUTCFullYear(), cursor.value.getUTCMonth() + delta, 1))
}

function dayMeta(date: string) {
  return days.value.find(d => d.date === date)
}

function openExceptionFor(date: string) {
  exceptionForm.date = date
  exceptionSheet.value = true
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

const exceptionKindItems = [
  { label: 'مسدودی', value: 'BLOCK', description: 'در این روز/بازه رزرو گرفته نمی‌شود' },
  { label: 'ساعت اضافه', value: 'OPEN', description: 'خارج از برنامه هفتگی باز می‌شود' },
]

watch(cursor, load, { immediate: true })

useHead({ title: 'ساعت کاری و تقویم | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="ساعت کاری و تقویم" description="زمان‌ها به وقت تهران است. رزروهای فعال از بازه‌های آزاد کم می‌شوند." />

    <InlineMessage :message="error" class="mb-4" />

    <!-- Weekly rules -->
    <AppSection title="برنامه هفتگی" description="بازه‌های تکرارشونده هر هفته." flush>
      <template #actions>
        <UButton size="sm" icon="i-lucide-plus" @click="ruleSheet = true">افزودن بازه</UButton>
      </template>
      <div v-if="loading && !rules.length" class="px-4 pb-4 sm:px-5"><SkeletonList :rows="3" /></div>
      <ul v-else class="divide-y divide-muted border-t border-muted">
        <li v-for="day in WEEKDAY_ORDER" :key="day" class="flex items-start gap-3 px-4 py-3 sm:px-5">
          <span class="w-16 shrink-0 pt-1.5 text-sm font-semibold text-highlighted">{{ WEEKDAY_LABELS[day] }}</span>
          <div class="min-w-0 flex-1">
            <p v-if="!rulesFor(day).length" class="pt-1.5 text-sm text-dimmed">تعطیل</p>
            <ul v-else class="flex flex-wrap gap-2">
              <li
                v-for="rule in rulesFor(day)"
                :key="rule.id"
                class="inline-flex items-center gap-1 rounded-full border py-0.5 ps-3 pe-1 text-sm"
                :class="rule.isActive ? 'border-forest-200 bg-forest-50 text-forest-900 dark:border-forest-400 dark:text-forest-200' : 'border-default bg-canvas text-dimmed line-through'"
              >
                <span class="num">{{ rule.startTime }}–{{ rule.endTime }}</span>
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  square
                  :icon="rule.isActive ? 'i-lucide-pause' : 'i-lucide-play'"
                  :loading="busyId === rule.id"
                  :aria-label="rule.isActive ? 'غیرفعال کردن بازه' : 'فعال کردن بازه'"
                  @click="toggleRule(rule)"
                />
                <UButton color="neutral" variant="ghost" size="xs" square icon="i-lucide-x" aria-label="حذف بازه" @click="ruleToDelete = rule" />
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </AppSection>

    <!-- Month calendar -->
    <AppSection class="mt-6" flush aria-label="تقویم ماهانه">
      <div class="flex items-center justify-between px-4 pt-4 sm:px-5">
        <h2 class="text-base font-bold text-highlighted">{{ monthLabel }}</h2>
        <div class="flex items-center gap-1">
          <UButton color="neutral" variant="ghost" size="md" square icon="i-lucide-chevron-right" aria-label="ماه قبل" @click="shiftMonth(-1)" />
          <UButton color="neutral" variant="ghost" size="md" square icon="i-lucide-chevron-left" aria-label="ماه بعد" @click="shiftMonth(1)" />
        </div>
      </div>
      <div class="px-2 pt-3 pb-3 sm:px-4">
        <div class="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted">
          <span v-for="d in WEEKDAY_ORDER" :key="d" class="truncate">{{ WEEKDAY_LABELS[d] }}</span>
        </div>
        <div class="mt-1 grid grid-cols-7 gap-1" :class="loading && 'opacity-60'">
          <template v-for="(cell, i) in monthCells" :key="i">
            <span v-if="!cell" aria-hidden="true" />
            <button
              v-else
              type="button"
              class="flex min-h-14 flex-col items-center justify-start gap-0.5 rounded-lg border p-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-primary sm:min-h-16"
              :class="[
                dayMeta(cell)?.blocked ? 'border-ink-200 bg-canvas-deep text-dimmed' : dayMeta(cell)?.slots.length ? 'border-forest-200 bg-forest-50 text-forest-900 dark:border-forest-400 dark:text-forest-200' : 'border-default bg-paper text-muted',
                cell === todayKey && 'ring-2 ring-terracotta-400',
              ]"
              :aria-label="`${formatCalendarDay(cell)}${dayMeta(cell)?.blocked ? '، مسدود' : dayMeta(cell)?.slots.length ? `، ${formatNumber(dayMeta(cell)!.slots.length)} بازه آزاد` : '، تعطیل'}`"
              @click="openExceptionFor(cell)"
            >
              <span class="num text-sm font-bold">{{ formatCalendarDay(cell, { weekday: undefined, month: undefined }) }}</span>
              <span v-if="dayMeta(cell)?.blocked" class="hidden sm:inline">مسدود</span>
              <span v-else-if="dayMeta(cell)?.slots.length" class="num hidden text-[10px] sm:inline">
                {{ dayMeta(cell)!.slots[0]!.startTime }}–{{ dayMeta(cell)!.slots[0]!.endTime }}
              </span>
              <span v-if="dayMeta(cell)?.slots.length" class="size-1.5 rounded-full bg-primary sm:hidden" aria-hidden="true" />
            </button>
          </template>
        </div>
        <p class="mt-2 text-xs text-muted">برای ثبت مسدودی یا ساعت اضافه روی یک روز بزنید.</p>
      </div>
    </AppSection>

    <!-- Exceptions -->
    <AppSection title="استثناها" :description="`مسدودی‌ها و ساعت‌های اضافه ${monthLabel}`" class="mt-6" flush>
      <template #actions>
        <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-calendar-plus" @click="exceptionSheet = true">ثبت استثنا</UButton>
      </template>
      <p v-if="!exceptions.length" class="px-4 pb-4 text-sm text-muted sm:px-5">استثنایی در این ماه نیست.</p>
      <ul v-else class="divide-y divide-muted border-t border-muted text-sm">
        <li v-for="item in exceptions" :key="item.id" class="flex items-center gap-3 px-4 py-3 sm:px-5">
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-full"
            :class="item.kind === 'BLOCK' ? 'bg-red-50 text-red-700 dark:text-red-300' : 'bg-forest-50 text-forest-700 dark:text-forest-200'"
            aria-hidden="true"
          >
            <UIcon :name="item.kind === 'BLOCK' ? 'i-lucide-ban' : 'i-lucide-plus'" class="size-4" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="font-medium text-highlighted">{{ formatCalendarDay(item.date) }} · {{ item.kind === 'BLOCK' ? 'مسدودی' : 'ساعت اضافه' }}</p>
            <p class="text-muted">
              <span class="num">{{ item.startTime && item.endTime ? `${item.startTime}–${item.endTime}` : 'تمام روز' }}</span>
              <span v-if="item.note"> · {{ item.note }}</span>
            </p>
          </div>
          <UButton color="neutral" variant="ghost" size="md" square icon="i-lucide-trash-2" :loading="busyId === item.id" aria-label="حذف استثنا" @click="removeException(item.id)" />
        </li>
      </ul>
    </AppSection>

    <!-- Add rule sheet -->
    <USlideover v-model:open="ruleSheet" side="bottom" title="افزودن بازه هفتگی" description="این بازه هر هفته تکرار می‌شود." :ui="{ content: 'max-h-[85dvh] rounded-t-2xl sm:max-w-lg sm:mx-auto' }">
      <template #body>
        <form id="rule-form" class="space-y-4" @submit.prevent="addRule">
          <UFormField label="روز هفته" name="weekday">
            <USelect v-model="ruleForm.weekday" :items="weekdayItems" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="شروع" name="start">
              <UInput v-model="ruleForm.startTime" type="time" class="w-full ltr" required />
            </UFormField>
            <UFormField label="پایان" name="end">
              <UInput v-model="ruleForm.endTime" type="time" class="w-full ltr" required />
            </UFormField>
          </div>
          <USwitch v-model="ruleForm.isActive" label="فعال" description="بازه‌های غیرفعال در تقویم عمومی دیده نمی‌شوند." />
        </form>
      </template>
      <template #footer>
        <div class="flex w-full gap-2 pb-safe">
          <UButton color="neutral" variant="ghost" class="flex-1" @click="ruleSheet = false">انصراف</UButton>
          <UButton type="submit" form="rule-form" class="flex-1" :loading="rulePending">ذخیره</UButton>
        </div>
      </template>
    </USlideover>

    <!-- Add exception sheet -->
    <USlideover v-model:open="exceptionSheet" side="bottom" title="ثبت استثنا" description="یک روز را ببندید یا خارج از برنامه باز کنید." :ui="{ content: 'max-h-[85dvh] rounded-t-2xl sm:max-w-lg sm:mx-auto' }">
      <template #body>
        <form id="exception-form" class="space-y-4" @submit.prevent="addException">
          <UFormField label="تاریخ" name="date" required :help="exceptionForm.date ? formatCalendarDay(exceptionForm.date) : ''">
            <UInput v-model="exceptionForm.date" type="date" class="w-full ltr" required />
          </UFormField>
          <URadioGroup v-model="exceptionForm.kind" :items="exceptionKindItems" legend="نوع" variant="card" orientation="horizontal" :ui="{ fieldset: 'grid grid-cols-2 gap-2 w-full', item: 'w-full' }" />
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="شروع" name="exStart" help="خالی = تمام روز">
              <UInput v-model="exceptionForm.startTime" type="time" class="w-full ltr" />
            </UFormField>
            <UFormField label="پایان" name="exEnd">
              <UInput v-model="exceptionForm.endTime" type="time" class="w-full ltr" />
            </UFormField>
          </div>
          <UFormField label="یادداشت" name="note">
            <UInput v-model="exceptionForm.note" placeholder="اختیاری" class="w-full" />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <div class="flex w-full gap-2 pb-safe">
          <UButton color="neutral" variant="ghost" class="flex-1" @click="exceptionSheet = false">انصراف</UButton>
          <UButton type="submit" form="exception-form" class="flex-1" :loading="exceptionPending" :disabled="!exceptionForm.date">ثبت استثنا</UButton>
        </div>
      </template>
    </USlideover>

    <!-- Delete rule confirmation -->
    <UModal :open="Boolean(ruleToDelete)" title="حذف بازه" description="این بازه از برنامه هفتگی حذف می‌شود." @update:open="(v: boolean) => { if (!v) ruleToDelete = null }">
      <template #body>
        <p v-if="ruleToDelete" class="text-sm text-default">
          {{ WEEKDAY_LABELS[ruleToDelete.weekday] }} · <span class="num">{{ ruleToDelete.startTime }}–{{ ruleToDelete.endTime }}</span>
        </p>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" size="md" @click="ruleToDelete = null">انصراف</UButton>
          <UButton color="error" size="md" icon="i-lucide-trash-2" :loading="Boolean(ruleToDelete && busyId === ruleToDelete.id)" @click="removeRule">حذف</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
