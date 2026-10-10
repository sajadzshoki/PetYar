<script setup lang="ts">
import type { PetDetail } from '~~/shared/types/pet'
import { PET_GENDER_LABELS, PET_TYPE_LABELS } from '~~/shared/constants/pets'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const pet = ref<PetDetail | null>(null)
const loading = ref(true)
const error = ref('')
const flash = ref('')
const photoInput = ref<HTMLInputElement | null>(null)

const vac = reactive({ name: '', administeredOn: '', nextDueOn: '', notes: '' })
const med = reactive({ name: '', dosage: '', frequency: '', startedOn: '', endedOn: '', notes: '' })
const noteBody = ref('')
const recordError = ref('')

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

async function onPhoto(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const body = new FormData()
    body.append('file', file)
    const res = await $fetch<{ data: { pet: PetDetail } }>(`/api/pets/${id.value}/photo`, { method: 'POST', body })
    if (pet.value) pet.value = { ...pet.value, ...res.data.pet }
    flash.value = 'عکس به‌روز شد'
  }
  catch (err) {
    recordError.value = apiErrorMessage(err, 'آپلود عکس ناموفق بود')
  }
  finally {
    input.value = ''
  }
}

async function archive() {
  if (!confirm('پرونده بایگانی شود؟ سوابق حذف نمی‌شوند.')) return
  await $fetch(`/api/pets/${id.value}`, { method: 'DELETE' })
  flash.value = 'بایگانی شد'
  await load()
}

async function restore() {
  await $fetch(`/api/pets/${id.value}/restore`, { method: 'POST' })
  flash.value = 'از بایگانی خارج شد'
  await load()
}

async function addVac() {
  recordError.value = ''
  try {
    await $fetch(`/api/pets/${id.value}/vaccinations`, { method: 'POST', body: { ...vac } })
    vac.name = ''
    vac.administeredOn = ''
    vac.nextDueOn = ''
    vac.notes = ''
    await load()
  }
  catch (err) {
    recordError.value = apiErrorMessage(err, 'ثبت واکسن ناموفق بود')
  }
}

async function delVac(vid: string) {
  await $fetch(`/api/pets/${id.value}/vaccinations/${vid}`, { method: 'DELETE' })
  await load()
}

async function addMed() {
  recordError.value = ''
  try {
    await $fetch(`/api/pets/${id.value}/medications`, { method: 'POST', body: { ...med } })
    med.name = ''
    med.dosage = ''
    med.frequency = ''
    med.startedOn = ''
    med.endedOn = ''
    med.notes = ''
    await load()
  }
  catch (err) {
    recordError.value = apiErrorMessage(err, 'ثبت دارو ناموفق بود')
  }
}

async function delMed(mid: string) {
  await $fetch(`/api/pets/${id.value}/medications/${mid}`, { method: 'DELETE' })
  await load()
}

async function addNote() {
  recordError.value = ''
  try {
    await $fetch(`/api/pets/${id.value}/care-notes`, { method: 'POST', body: { body: noteBody.value } })
    noteBody.value = ''
    await load()
  }
  catch (err) {
    recordError.value = apiErrorMessage(err, 'ثبت یادداشت ناموفق بود')
  }
}

async function delNote(nid: string) {
  await $fetch(`/api/pets/${id.value}/care-notes/${nid}`, { method: 'DELETE' })
  await load()
}

watch(id, load, { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-12">
    <NuxtLink to="/pets" class="text-sm text-ink-600">همه حیوانات</NuxtLink>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <AppState v-else-if="error" :title="error" />
    <template v-else-if="pet">
      <div class="mt-4 flex items-start gap-4">
        <button type="button" class="h-24 w-24 shrink-0 overflow-hidden border border-ink-200 bg-canvas-deep" @click="photoInput?.click()">
          <img v-if="pet.photoUrl" :src="pet.photoUrl" alt="" class="h-full w-full object-cover">
          <span v-else class="flex h-full w-full items-center justify-center text-ink-400">
            <UIcon name="i-lucide-camera" class="size-7" />
          </span>
        </button>
        <input ref="photoInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onPhoto">
        <div>
          <h1 class="text-2xl font-semibold">{{ pet.name }}</h1>
          <p class="mt-1 text-sm text-ink-600">
            {{ PET_TYPE_LABELS[pet.type] }}
            <template v-if="pet.breed"> · {{ pet.breed }}</template>
            · {{ PET_GENDER_LABELS[pet.gender] }}
          </p>
          <p v-if="pet.archivedAt" class="mt-2 text-sm text-ink-500">بایگانی‌شده</p>
          <div class="mt-3 flex flex-wrap gap-3 text-sm">
            <NuxtLink :to="`/pets/${pet.id}/edit`" class="text-terracotta-700">ویرایش</NuxtLink>
            <button v-if="!pet.archivedAt" type="button" class="text-ink-600" @click="archive">بایگانی</button>
            <button v-else type="button" class="text-forest-700" @click="restore">بازگردانی</button>
          </div>
        </div>
      </div>

      <p v-if="flash" class="mt-4 text-sm text-forest-700">{{ flash }}</p>
      <p v-if="recordError" class="mt-2 text-sm text-terracotta-700">{{ recordError }}</p>

      <dl class="mt-8 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-ink-500">تاریخ تولد</dt>
          <dd class="mt-1">{{ pet.birthDate || '—' }}</dd>
        </div>
        <div>
          <dt class="text-ink-500">وزن</dt>
          <dd class="mt-1">{{ pet.weightKg != null ? `${pet.weightKg} کیلوگرم` : '—' }}</dd>
        </div>
        <div>
          <dt class="text-ink-500">عقیم‌سازی</dt>
          <dd class="mt-1">{{ pet.neutered ? 'بله' : 'خیر' }}</dd>
        </div>
      </dl>
      <div class="mt-6 space-y-4 text-sm leading-7">
        <p><span class="text-ink-500">آلرژی:</span> {{ pet.allergies || '—' }}</p>
        <p><span class="text-ink-500">پزشکی:</span> {{ pet.medicalNotes || '—' }}</p>
        <p><span class="text-ink-500">رفتار:</span> {{ pet.behaviorNotes || '—' }}</p>
      </div>

      <section class="mt-12 border-t border-ink-200 pt-8">
        <h2 class="text-lg font-medium">واکسن‌ها</h2>
        <ul v-if="pet.vaccinations.length" class="mt-4 space-y-3 text-sm">
          <li v-for="item in pet.vaccinations" :key="item.id" class="flex justify-between gap-3 border-b border-ink-100 pb-3">
            <div>
              <p class="font-medium">{{ item.name }}</p>
              <p class="text-ink-600">{{ item.administeredOn }}<template v-if="item.nextDueOn"> · نوبت بعد {{ item.nextDueOn }}</template></p>
              <p v-if="item.notes" class="mt-1 text-ink-500">{{ item.notes }}</p>
            </div>
            <button type="button" class="text-ink-500" @click="delVac(item.id)">حذف</button>
          </li>
        </ul>
        <p v-else class="mt-3 text-sm text-ink-500">سابقه‌ای ثبت نشده.</p>
        <form class="mt-5 space-y-3" @submit.prevent="addVac">
          <UInput v-model="vac.name" placeholder="نام واکسن" class="w-full" />
          <div class="grid gap-3 sm:grid-cols-2">
            <UInput v-model="vac.administeredOn" type="date" class="w-full" dir="ltr" />
            <UInput v-model="vac.nextDueOn" type="date" class="w-full" dir="ltr" />
          </div>
          <UInput v-model="vac.notes" placeholder="یادداشت (اختیاری)" class="w-full" />
          <UButton type="submit" size="sm" color="neutral" variant="outline">افزودن واکسن</UButton>
        </form>
      </section>

      <section class="mt-12 border-t border-ink-200 pt-8">
        <h2 class="text-lg font-medium">داروها</h2>
        <ul v-if="pet.medications.length" class="mt-4 space-y-3 text-sm">
          <li v-for="item in pet.medications" :key="item.id" class="flex justify-between gap-3 border-b border-ink-100 pb-3">
            <div>
              <p class="font-medium">{{ item.name }}</p>
              <p class="text-ink-600">{{ item.dosage }} {{ item.frequency }}</p>
            </div>
            <button type="button" class="text-ink-500" @click="delMed(item.id)">حذف</button>
          </li>
        </ul>
        <p v-else class="mt-3 text-sm text-ink-500">دارویی ثبت نشده.</p>
        <form class="mt-5 space-y-3" @submit.prevent="addMed">
          <UInput v-model="med.name" placeholder="نام دارو" class="w-full" />
          <div class="grid gap-3 sm:grid-cols-2">
            <UInput v-model="med.dosage" placeholder="دوز" class="w-full" />
            <UInput v-model="med.frequency" placeholder="تناوب" class="w-full" />
          </div>
          <UButton type="submit" size="sm" color="neutral" variant="outline">افزودن دارو</UButton>
        </form>
      </section>

      <section class="mt-12 border-t border-ink-200 pt-8">
        <h2 class="text-lg font-medium">یادداشت مراقبت</h2>
        <ul v-if="pet.careNotes.length" class="mt-4 space-y-3 text-sm">
          <li v-for="item in pet.careNotes" :key="item.id" class="flex justify-between gap-3 border-b border-ink-100 pb-3">
            <p class="leading-7">{{ item.body }}</p>
            <button type="button" class="shrink-0 text-ink-500" @click="delNote(item.id)">حذف</button>
          </li>
        </ul>
        <p v-else class="mt-3 text-sm text-ink-500">یادداشتی نیست.</p>
        <form class="mt-5 space-y-3" @submit.prevent="addNote">
          <UTextarea v-model="noteBody" class="w-full" :rows="3" placeholder="مثلاً برنامه غذا یا حساسیت به صدا" />
          <UButton type="submit" size="sm" color="neutral" variant="outline">افزودن یادداشت</UButton>
        </form>
      </section>
    </template>
  </div>
</template>
