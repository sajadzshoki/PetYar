<script setup lang="ts">
import type { PetDetail } from '~~/shared/types/pet'
import { PET_GENDER_LABELS, PET_TYPE_LABELS } from '~~/shared/constants/pets'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const toast = useToast()
const id = computed(() => String(route.params.id))
const pet = ref<PetDetail | null>(null)
const loading = ref(true)
const error = ref('')
const photoInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

const vac = reactive({ name: '', administeredOn: '', nextDueOn: '', notes: '' })
const med = reactive({ name: '', dosage: '', frequency: '', startedOn: '', endedOn: '', notes: '' })
const noteBody = ref('')
const recordError = ref('')
const busy = ref('')
const archiveOpen = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { pet: PetDetail } }>(`/api/pets/${id.value}`)
    pet.value = res.data.pet
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری پرونده ناموفق بود')
    pet.value = null
  }
  finally {
    loading.value = false
  }
}

function ok(title: string) {
  toast.add({ title, icon: 'i-lucide-circle-check', color: 'success' })
}

async function onPhoto(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  recordError.value = ''
  try {
    const body = new FormData()
    body.append('file', file)
    const res = await $fetch<{ data: { pet: PetDetail } }>(`/api/pets/${id.value}/photo`, { method: 'POST', body })
    if (pet.value) pet.value = { ...pet.value, ...res.data.pet }
    ok('عکس به‌روز شد')
  }
  catch (err) {
    recordError.value = apiErrorMessage(err, 'آپلود عکس ناموفق بود')
  }
  finally {
    uploading.value = false
    input.value = ''
  }
}

async function archive() {
  busy.value = 'archive'
  try {
    await $fetch(`/api/pets/${id.value}`, { method: 'DELETE' })
    archiveOpen.value = false
    ok('پرونده بایگانی شد')
    await load()
  }
  catch (err) {
    recordError.value = apiErrorMessage(err, 'بایگانی ناموفق بود')
  }
  finally {
    busy.value = ''
  }
}

async function restore() {
  busy.value = 'restore'
  try {
    await $fetch(`/api/pets/${id.value}/restore`, { method: 'POST' })
    ok('از بایگانی خارج شد')
    await load()
  }
  catch (err) {
    recordError.value = apiErrorMessage(err, 'بازگردانی ناموفق بود')
  }
  finally {
    busy.value = ''
  }
}

async function addVac() {
  recordError.value = ''
  busy.value = 'vac'
  try {
    await $fetch(`/api/pets/${id.value}/vaccinations`, { method: 'POST', body: { ...vac } })
    vac.name = ''
    vac.administeredOn = ''
    vac.nextDueOn = ''
    vac.notes = ''
    ok('واکسن ثبت شد')
    await load()
  }
  catch (err) {
    recordError.value = apiErrorMessage(err, 'ثبت واکسن ناموفق بود')
  }
  finally {
    busy.value = ''
  }
}

async function delVac(vid: string) {
  busy.value = vid
  try {
    await $fetch(`/api/pets/${id.value}/vaccinations/${vid}`, { method: 'DELETE' })
    await load()
  }
  catch (err) {
    recordError.value = apiErrorMessage(err, 'حذف ناموفق بود')
  }
  finally {
    busy.value = ''
  }
}

async function addMed() {
  recordError.value = ''
  busy.value = 'med'
  try {
    await $fetch(`/api/pets/${id.value}/medications`, { method: 'POST', body: { ...med } })
    med.name = ''
    med.dosage = ''
    med.frequency = ''
    med.startedOn = ''
    med.endedOn = ''
    med.notes = ''
    ok('دارو ثبت شد')
    await load()
  }
  catch (err) {
    recordError.value = apiErrorMessage(err, 'ثبت دارو ناموفق بود')
  }
  finally {
    busy.value = ''
  }
}

async function delMed(mid: string) {
  busy.value = mid
  try {
    await $fetch(`/api/pets/${id.value}/medications/${mid}`, { method: 'DELETE' })
    await load()
  }
  catch (err) {
    recordError.value = apiErrorMessage(err, 'حذف ناموفق بود')
  }
  finally {
    busy.value = ''
  }
}

async function addNote() {
  recordError.value = ''
  busy.value = 'note'
  try {
    await $fetch(`/api/pets/${id.value}/care-notes`, { method: 'POST', body: { body: noteBody.value } })
    noteBody.value = ''
    ok('یادداشت ثبت شد')
    await load()
  }
  catch (err) {
    recordError.value = apiErrorMessage(err, 'ثبت یادداشت ناموفق بود')
  }
  finally {
    busy.value = ''
  }
}

async function delNote(nid: string) {
  busy.value = nid
  try {
    await $fetch(`/api/pets/${id.value}/care-notes/${nid}`, { method: 'DELETE' })
    await load()
  }
  catch (err) {
    recordError.value = apiErrorMessage(err, 'حذف ناموفق بود')
  }
  finally {
    busy.value = ''
  }
}

function dateLabel(ymd: string | null) {
  if (!ymd) return '—'
  return formatCalendarDay(ymd, { weekday: undefined, year: 'numeric' })
}

watch(id, load, { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <NuxtLink
      to="/pets"
      class="-ms-1 mb-3 inline-flex min-h-touch items-center gap-1.5 rounded-md px-1 text-sm font-medium text-muted hover:text-highlighted"
    >
      <UIcon name="i-lucide-arrow-right" class="size-4" aria-hidden="true" />
      همه حیوانات
    </NuxtLink>

    <SkeletonList v-if="loading" :rows="3" />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />

    <template v-else-if="pet">
      <!-- Identity -->
      <AppSection>
        <div class="flex items-start gap-4">
          <button
            type="button"
            class="group relative shrink-0 rounded-xl focus-visible:ring-2 focus-visible:ring-primary"
            :aria-label="uploading ? 'در حال آپلود عکس' : 'تغییر عکس'"
            :disabled="uploading"
            @click="photoInput?.click()"
          >
            <MediaThumb :src="pet.photoUrl" :icon="PET_TYPE_ICONS[pet.type]" size-class="size-24" rounded="xl" />
            <span class="absolute -bottom-1 -end-1 flex size-7 items-center justify-center rounded-full border-2 border-paper bg-primary text-inverted">
              <UIcon :name="uploading ? 'i-lucide-loader' : 'i-lucide-camera'" class="size-3.5" :class="uploading && 'animate-spin'" aria-hidden="true" />
            </span>
          </button>
          <input ref="photoInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onPhoto">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl">{{ pet.name }}</h1>
              <UBadge v-if="pet.archivedAt" color="neutral" variant="subtle" size="sm" class="rounded-full" icon="i-lucide-archive">بایگانی‌شده</UBadge>
            </div>
            <p class="mt-1 text-sm text-muted">
              {{ PET_TYPE_LABELS[pet.type] }}<template v-if="pet.breed"> · {{ pet.breed }}</template> · {{ PET_GENDER_LABELS[pet.gender] }}
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <UButton :to="`/pets/${pet.id}/edit`" size="sm" color="neutral" variant="outline" icon="i-lucide-pencil">ویرایش</UButton>
              <UButton
                v-if="!pet.archivedAt"
                size="sm"
                color="neutral"
                variant="ghost"
                icon="i-lucide-archive"
                @click="archiveOpen = true"
              >
                بایگانی
              </UButton>
              <UButton
                v-else
                size="sm"
                color="primary"
                variant="soft"
                icon="i-lucide-archive-restore"
                :loading="busy === 'restore'"
                @click="restore"
              >
                بازگردانی
              </UButton>
            </div>
          </div>
        </div>

        <dl class="mt-5 grid grid-cols-3 gap-3 border-t border-muted pt-4 text-sm">
          <div>
            <dt class="text-xs text-muted">تاریخ تولد</dt>
            <dd class="mt-0.5 font-medium text-highlighted">{{ dateLabel(pet.birthDate) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted">وزن</dt>
            <dd class="mt-0.5 font-medium text-highlighted">
              <template v-if="pet.weightKg != null"><span class="num">{{ formatNumber(pet.weightKg) }}</span> کیلوگرم</template>
              <template v-else>—</template>
            </dd>
          </div>
          <div>
            <dt class="text-xs text-muted">عقیم‌سازی</dt>
            <dd class="mt-0.5 font-medium text-highlighted">{{ pet.neutered ? 'بله' : 'خیر' }}</dd>
          </div>
        </dl>
      </AppSection>

      <InlineMessage :message="recordError" class="mt-4" />

      <!-- Health notes -->
      <AppSection title="سلامت و رفتار" class="mt-6">
        <dl class="space-y-3 text-sm leading-7">
          <div>
            <dt class="font-semibold text-highlighted">آلرژی</dt>
            <dd class="text-toned">{{ pet.allergies || 'ثبت نشده' }}</dd>
          </div>
          <div>
            <dt class="font-semibold text-highlighted">یادداشت پزشکی</dt>
            <dd class="text-toned">{{ pet.medicalNotes || 'ثبت نشده' }}</dd>
          </div>
          <div>
            <dt class="font-semibold text-highlighted">رفتار</dt>
            <dd class="text-toned">{{ pet.behaviorNotes || 'ثبت نشده' }}</dd>
          </div>
        </dl>
      </AppSection>

      <!-- Vaccinations -->
      <AppSection title="واکسن‌ها" class="mt-6">
        <ul v-if="pet.vaccinations.length" class="divide-y divide-muted">
          <li v-for="item in pet.vaccinations" :key="item.id" class="flex items-start gap-3 py-3 first:pt-0">
            <span class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-primary">
              <UIcon name="i-lucide-syringe" class="size-4" aria-hidden="true" />
            </span>
            <div class="min-w-0 flex-1 text-sm">
              <p class="font-semibold text-highlighted">{{ item.name }}</p>
              <p class="text-muted">
                {{ dateLabel(item.administeredOn) }}
                <template v-if="item.nextDueOn"> · نوبت بعد: {{ dateLabel(item.nextDueOn) }}</template>
              </p>
              <p v-if="item.notes" class="mt-1 text-toned">{{ item.notes }}</p>
            </div>
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-trash-2"
              aria-label="حذف واکسن"
              :loading="busy === item.id"
              @click="delVac(item.id)"
            />
          </li>
        </ul>
        <p v-else class="text-sm text-muted">سابقه‌ای ثبت نشده.</p>

        <form class="mt-4 space-y-3 rounded-lg bg-canvas p-3" @submit.prevent="addVac">
          <p class="text-xs font-semibold text-muted">افزودن واکسن</p>
          <UInput v-model="vac.name" placeholder="نام واکسن" class="w-full" size="md" required />
          <div class="grid grid-cols-2 gap-2">
            <UFormField label="تاریخ تزریق" size="sm">
              <UInput v-model="vac.administeredOn" type="date" class="w-full" dir="ltr" size="md" required />
            </UFormField>
            <UFormField label="نوبت بعد" size="sm">
              <UInput v-model="vac.nextDueOn" type="date" class="w-full" dir="ltr" size="md" />
            </UFormField>
          </div>
          <UInput v-model="vac.notes" placeholder="یادداشت (اختیاری)" class="w-full" size="md" />
          <UButton type="submit" size="md" color="neutral" variant="outline" icon="i-lucide-plus" :loading="busy === 'vac'" :disabled="!vac.name.trim() || !vac.administeredOn">
            افزودن واکسن
          </UButton>
        </form>
      </AppSection>

      <!-- Medications -->
      <AppSection title="داروها" class="mt-6">
        <ul v-if="pet.medications.length" class="divide-y divide-muted">
          <li v-for="item in pet.medications" :key="item.id" class="flex items-start gap-3 py-3 first:pt-0">
            <span class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-terracotta-50 text-terracotta-700 dark:text-terracotta-300">
              <UIcon name="i-lucide-pill" class="size-4" aria-hidden="true" />
            </span>
            <div class="min-w-0 flex-1 text-sm">
              <p class="font-semibold text-highlighted">{{ item.name }}</p>
              <p class="text-muted">{{ [item.dosage, item.frequency].filter(Boolean).join(' · ') || 'بدون جزئیات' }}</p>
            </div>
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-trash-2"
              aria-label="حذف دارو"
              :loading="busy === item.id"
              @click="delMed(item.id)"
            />
          </li>
        </ul>
        <p v-else class="text-sm text-muted">دارویی ثبت نشده.</p>

        <form class="mt-4 space-y-3 rounded-lg bg-canvas p-3" @submit.prevent="addMed">
          <p class="text-xs font-semibold text-muted">افزودن دارو</p>
          <UInput v-model="med.name" placeholder="نام دارو" class="w-full" size="md" required />
          <div class="grid grid-cols-2 gap-2">
            <UInput v-model="med.dosage" placeholder="دوز" class="w-full" size="md" />
            <UInput v-model="med.frequency" placeholder="تناوب" class="w-full" size="md" />
          </div>
          <UButton type="submit" size="md" color="neutral" variant="outline" icon="i-lucide-plus" :loading="busy === 'med'" :disabled="!med.name.trim()">
            افزودن دارو
          </UButton>
        </form>
      </AppSection>

      <!-- Care notes -->
      <AppSection title="یادداشت مراقبت" class="mt-6">
        <ul v-if="pet.careNotes.length" class="divide-y divide-muted">
          <li v-for="item in pet.careNotes" :key="item.id" class="flex items-start gap-3 py-3 first:pt-0">
            <span class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-canvas-deep text-toned">
              <UIcon name="i-lucide-notebook-pen" class="size-4" aria-hidden="true" />
            </span>
            <div class="min-w-0 flex-1 text-sm">
              <p class="leading-7 text-default">{{ item.body }}</p>
              <p class="text-xs text-dimmed">{{ formatRelative(item.createdAt) }}</p>
            </div>
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-trash-2"
              aria-label="حذف یادداشت"
              :loading="busy === item.id"
              @click="delNote(item.id)"
            />
          </li>
        </ul>
        <p v-else class="text-sm text-muted">یادداشتی نیست.</p>

        <form class="mt-4 space-y-3 rounded-lg bg-canvas p-3" @submit.prevent="addNote">
          <UTextarea v-model="noteBody" class="w-full" :rows="2" size="md" placeholder="مثلاً برنامه غذا یا حساسیت به صدا" />
          <UButton type="submit" size="md" color="neutral" variant="outline" icon="i-lucide-plus" :loading="busy === 'note'" :disabled="!noteBody.trim()">
            افزودن یادداشت
          </UButton>
        </form>
      </AppSection>

      <UModal v-model:open="archiveOpen" title="بایگانی پرونده" description="پرونده از فهرست اصلی پنهان می‌شود؛ سوابق واکسن و دارو حذف نمی‌شوند و هر زمان قابل بازگردانی است.">
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="archiveOpen = false">انصراف</UButton>
            <UButton color="neutral" icon="i-lucide-archive" :loading="busy === 'archive'" @click="archive">بایگانی شود</UButton>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
