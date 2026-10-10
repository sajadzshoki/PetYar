<script setup lang="ts">
import type { ProviderProfile } from '~~/shared/types/provider'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const { fetch: refreshSession } = useUserSession()
const provider = ref<ProviderProfile | null>(null)
const loading = ref(true)
const pending = ref(false)
const error = ref('')
const ok = ref('')
const photoInput = ref<HTMLInputElement | null>(null)
const galleryInput = ref<HTMLInputElement | null>(null)

const form = reactive({
  displayName: '',
  bio: '',
  experienceYears: '',
  experience: '',
  serviceArea: '',
  city: '',
  district: '',
  latitude: '',
  longitude: '',
  serviceRadiusKm: '',
  isActive: true,
})

function fill(p: ProviderProfile) {
  provider.value = p
  form.displayName = p.displayName
  form.bio = p.bio || ''
  form.experienceYears = p.experienceYears != null ? String(p.experienceYears) : ''
  form.experience = p.experience || ''
  form.serviceArea = p.serviceArea || ''
  form.city = p.city || ''
  form.district = p.district || ''
  form.latitude = p.latitude != null ? String(p.latitude) : ''
  form.longitude = p.longitude != null ? String(p.longitude) : ''
  form.serviceRadiusKm = p.serviceRadiusKm != null ? String(p.serviceRadiusKm) : ''
  form.isActive = p.isActive
}

function payload() {
  return {
    ...form,
    experienceYears: form.experienceYears === '' ? null : Number(form.experienceYears),
    latitude: form.latitude === '' ? null : Number(form.latitude),
    longitude: form.longitude === '' ? null : Number(form.longitude),
    serviceRadiusKm: form.serviceRadiusKm === '' ? null : Number(form.serviceRadiusKm),
  }
}

async function load() {
  loading.value = true
  try {
    const res = await $fetch<{ data: { provider: ProviderProfile | null } }>('/api/provider')
    if (res.data.provider) fill(res.data.provider)
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

async function save() {
  pending.value = true
  error.value = ''
  ok.value = ''
  try {
    if (provider.value) {
      const res = await $fetch<{ data: { provider: ProviderProfile } }>('/api/provider', { method: 'PATCH', body: payload() })
      fill(res.data.provider)
      ok.value = 'پرونده ذخیره شد'
    }
    else {
      const res = await $fetch<{ data: { provider: ProviderProfile } }>('/api/provider', { method: 'POST', body: payload() })
      fill(res.data.provider)
      await refreshSession()
      ok.value = 'پرونده ساخته شد'
    }
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'ذخیره ناموفق بود')
  }
  finally {
    pending.value = false
  }
}

async function upload(url: string, file: File) {
  const body = new FormData()
  body.append('file', file)
  const res = await $fetch<{ data: { provider: ProviderProfile } }>(url, { method: 'POST', body })
  fill(res.data.provider)
}

async function onPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    await upload('/api/provider/photo', file)
    ok.value = 'تصویر به‌روز شد'
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'آپلود ناموفق بود')
  }
  ;(e.target as HTMLInputElement).value = ''
}

async function onGallery(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    await upload('/api/provider/gallery', file)
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'آپلود گالری ناموفق بود')
  }
  ;(e.target as HTMLInputElement).value = ''
}

async function removeGallery(id: string) {
  const res = await $fetch<{ data: { provider: ProviderProfile } }>(`/api/provider/gallery/${id}`, { method: 'DELETE' })
  fill(res.data.provider)
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-10">
    <h1 class="text-2xl font-semibold">پرونده عمومی</h1>
    <p class="mt-2 text-sm leading-7 text-ink-600">همین اطلاعات در صفحهٔ عمومی شما دیده می‌شود.</p>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <form v-else class="mt-8 space-y-4" @submit.prevent="save">
      <div v-if="provider" class="flex items-center gap-4">
        <button type="button" class="h-20 w-20 overflow-hidden border border-ink-200 bg-canvas-deep" @click="photoInput?.click()">
          <img v-if="provider.photoUrl" :src="provider.photoUrl" alt="" class="h-full w-full object-cover">
        </button>
        <button type="button" class="text-sm text-terracotta-700" @click="photoInput?.click()">تغییر تصویر</button>
        <input ref="photoInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onPhoto">
      </div>
      <UFormField label="نام نمایشی">
        <UInput v-model="form.displayName" class="w-full" />
      </UFormField>
      <UFormField label="معرفی">
        <UTextarea v-model="form.bio" class="w-full" :rows="4" />
      </UFormField>
      <UFormField label="سابقه (سال)">
        <UInput v-model="form.experienceYears" type="number" min="0" class="w-full" dir="ltr" />
      </UFormField>
      <UFormField label="شرح تجربه">
        <UTextarea v-model="form.experience" class="w-full" :rows="3" />
      </UFormField>
      <UFormField label="شهر">
        <UInput v-model="form.city" class="w-full" />
      </UFormField>
      <UFormField label="محله">
        <UInput v-model="form.district" class="w-full" />
      </UFormField>
      <UFormField label="محدوده خدمات">
        <UInput v-model="form.serviceArea" class="w-full" />
      </UFormField>
      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField label="عرض جغرافیایی">
          <UInput v-model="form.latitude" class="w-full" dir="ltr" />
        </UFormField>
        <UFormField label="طول جغرافیایی">
          <UInput v-model="form.longitude" class="w-full" dir="ltr" />
        </UFormField>
      </div>
      <UFormField label="شعاع (کیلومتر)">
        <UInput v-model="form.serviceRadiusKm" class="w-full" dir="ltr" />
      </UFormField>
      <UCheckbox v-model="form.isActive" label="پرونده فعال و قابل نمایش عمومی" />
      <p v-if="error" class="text-sm text-terracotta-700">{{ error }}</p>
      <p v-if="ok" class="text-sm text-forest-700">{{ ok }}</p>
      <UButton type="submit" :loading="pending">{{ provider ? 'ذخیره' : 'ساخت پرونده' }}</UButton>
    </form>

    <section v-if="provider" class="mt-12 border-t border-ink-200 pt-8">
      <h2 class="text-lg font-medium">گالری</h2>
      <div class="mt-4 grid grid-cols-3 gap-2">
        <div v-for="img in provider.gallery" :key="img.id" class="relative">
          <img :src="img.imageUrl" alt="" class="h-24 w-full object-cover ring-1 ring-ink-200">
          <button type="button" class="mt-1 text-xs text-ink-500" @click="removeGallery(img.id)">حذف</button>
        </div>
      </div>
      <input ref="galleryInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onGallery">
      <UButton class="mt-4" size="sm" color="neutral" variant="outline" @click="galleryInput?.click()">افزودن تصویر</UButton>
      <p class="mt-6">
        <NuxtLink :to="`/providers/${provider.id}`" class="text-sm text-ink-600">نمایش عمومی</NuxtLink>
      </p>
    </section>
  </div>
</template>
