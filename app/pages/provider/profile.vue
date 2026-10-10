<script setup lang="ts">
import type { ProviderProfile } from '~~/shared/types/provider'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const { fetch: refreshSession } = useUserSession()
const toast = useToast()
const provider = ref<ProviderProfile | null>(null)
const loading = ref(true)
const pending = ref(false)
const photoPending = ref(false)
const galleryPending = ref(false)
const removingId = ref<string | null>(null)
const locating = ref(false)
const error = ref('')
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
  error.value = ''
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
  try {
    if (provider.value) {
      const res = await $fetch<{ data: { provider: ProviderProfile } }>('/api/provider', { method: 'PATCH', body: payload() })
      fill(res.data.provider)
      toast.add({ title: 'پرونده ذخیره شد', icon: 'i-lucide-check', color: 'success' })
    }
    else {
      const res = await $fetch<{ data: { provider: ProviderProfile } }>('/api/provider', { method: 'POST', body: payload() })
      fill(res.data.provider)
      await refreshSession()
      toast.add({ title: 'پرونده ساخته شد', description: 'حالا خدمات و ساعت کاری‌تان را ثبت کنید.', icon: 'i-lucide-check', color: 'success' })
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
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  photoPending.value = true
  try {
    await upload('/api/provider/photo', file)
    toast.add({ title: 'تصویر به‌روز شد', icon: 'i-lucide-check', color: 'success' })
  }
  catch (err) {
    toast.add({ title: apiErrorMessage(err, 'آپلود ناموفق بود'), color: 'error', icon: 'i-lucide-circle-alert' })
  }
  finally {
    photoPending.value = false
  }
}

async function onGallery(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  galleryPending.value = true
  try {
    await upload('/api/provider/gallery', file)
  }
  catch (err) {
    toast.add({ title: apiErrorMessage(err, 'آپلود گالری ناموفق بود'), color: 'error', icon: 'i-lucide-circle-alert' })
  }
  finally {
    galleryPending.value = false
  }
}

async function removeGallery(id: string) {
  removingId.value = id
  try {
    const res = await $fetch<{ data: { provider: ProviderProfile } }>(`/api/provider/gallery/${id}`, { method: 'DELETE' })
    fill(res.data.provider)
  }
  catch (err) {
    toast.add({ title: apiErrorMessage(err, 'حذف ناموفق بود'), color: 'error', icon: 'i-lucide-circle-alert' })
  }
  finally {
    removingId.value = null
  }
}

function useMyLocation() {
  if (!import.meta.client || !navigator.geolocation) {
    toast.add({ title: 'مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند', color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.latitude = pos.coords.latitude.toFixed(6)
      form.longitude = pos.coords.longitude.toFixed(6)
      locating.value = false
    },
    () => {
      locating.value = false
      toast.add({ title: 'دسترسی به موقعیت داده نشد', color: 'error', icon: 'i-lucide-circle-alert' })
    },
    { enableHighAccuracy: false, timeout: 10_000 },
  )
}

onMounted(load)

useHead({ title: 'پرونده عمومی | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-narrow px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader
      :title="provider ? 'پرونده عمومی' : 'ساخت پرونده ارائه‌دهنده'"
      :description="provider ? 'همین اطلاعات در صفحه عمومی شما دیده می‌شود.' : 'با تکمیل این فرم، پرونده شما ساخته می‌شود و می‌توانید خدمات ثبت کنید.'"
    >
      <template v-if="provider" #actions>
        <UButton :to="`/providers/${provider.id}`" color="neutral" variant="outline" size="md" icon="i-lucide-eye">نمای عمومی</UButton>
      </template>
    </PageHeader>

    <SkeletonList v-if="loading" :rows="3" />

    <form v-else class="space-y-5" @submit.prevent="save">
      <!-- Photo + name -->
      <AppSection title="هویت">
        <div class="flex items-start gap-4">
          <div v-if="provider" class="relative shrink-0">
            <MediaThumb :src="provider.photoUrl" :alt="provider.displayName" :initial="initialOf(provider.displayName)" size-class="size-20 sm:size-24" rounded="xl" />
            <UButton
              type="button"
              size="xs"
              square
              icon="i-lucide-camera"
              class="absolute -bottom-1 -start-1 rounded-full"
              :loading="photoPending"
              aria-label="تغییر تصویر پروفایل"
              @click="photoInput?.click()"
            />
            <input ref="photoInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onPhoto">
          </div>
          <div class="min-w-0 flex-1 space-y-4">
            <UFormField label="نام نمایشی" name="displayName" required>
              <UInput v-model="form.displayName" class="w-full" maxlength="80" />
            </UFormField>
            <UFormField label="سابقه (سال)" name="experienceYears">
              <UInput v-model="form.experienceYears" type="number" min="0" max="60" inputmode="numeric" class="w-full ltr sm:max-w-40" />
            </UFormField>
          </div>
        </div>
        <div class="mt-4 space-y-4">
          <UFormField label="معرفی" name="bio" help="چه کسی هستید، چه حیواناتی را می‌شناسید و چرا باید به شما اعتماد کرد.">
            <UTextarea v-model="form.bio" class="w-full" :rows="4" maxlength="2000" />
          </UFormField>
          <UFormField label="شرح تجربه" name="experience">
            <UTextarea v-model="form.experience" class="w-full" :rows="3" maxlength="2000" />
          </UFormField>
        </div>
      </AppSection>

      <!-- Location -->
      <AppSection title="محل خدمات" description="برای نمایش در جستجوی «نزدیک من» مختصات را ثبت کنید.">
        <div class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="شهر" name="city">
              <UInput v-model="form.city" class="w-full" />
            </UFormField>
            <UFormField label="محله" name="district">
              <UInput v-model="form.district" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="محدوده خدمات" name="serviceArea" help="مثلاً: شمال و مرکز تهران">
            <UInput v-model="form.serviceArea" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="عرض جغرافیایی" name="latitude">
              <UInput v-model="form.latitude" class="w-full ltr" inputmode="decimal" placeholder="35.6892" />
            </UFormField>
            <UFormField label="طول جغرافیایی" name="longitude">
              <UInput v-model="form.longitude" class="w-full ltr" inputmode="decimal" placeholder="51.3890" />
            </UFormField>
          </div>
          <div class="flex flex-wrap items-end gap-3">
            <UFormField label="شعاع (کیلومتر)" name="serviceRadiusKm" class="w-32">
              <UInput v-model="form.serviceRadiusKm" class="w-full ltr" inputmode="numeric" />
            </UFormField>
            <UButton type="button" color="neutral" variant="outline" size="md" icon="i-lucide-locate" :loading="locating" @click="useMyLocation">موقعیت فعلی من</UButton>
          </div>
        </div>
      </AppSection>

      <AppSection>
        <USwitch v-model="form.isActive" label="پرونده فعال و قابل نمایش عمومی" description="با غیرفعال کردن، پرونده و خدمات شما از جستجو حذف می‌شوند." />
      </AppSection>

      <InlineMessage :message="error" />
      <UButton type="submit" block :loading="pending" :disabled="form.displayName.trim().length < 2" icon="i-lucide-check">
        {{ provider ? 'ذخیره تغییرات' : 'ساخت پرونده' }}
      </UButton>
    </form>

    <!-- Gallery -->
    <AppSection v-if="provider && !loading" title="گالری" description="تصاویر واقعی از محیط کار یا حیوان‌هایی که مراقبت کرده‌اید." class="mt-6">
      <template #actions>
        <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-image-plus" :loading="galleryPending" @click="galleryInput?.click()">افزودن</UButton>
      </template>
      <input ref="galleryInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onGallery">
      <p v-if="!provider.gallery.length" class="text-sm text-muted">هنوز تصویری اضافه نشده.</p>
      <ul v-else class="grid grid-cols-3 gap-2">
        <li v-for="img in provider.gallery" :key="img.id" class="relative">
          <img :src="img.imageUrl" alt="" class="aspect-square w-full rounded-lg object-cover ring-1 ring-default" loading="lazy">
          <UButton
            type="button"
            color="neutral"
            variant="solid"
            size="xs"
            square
            icon="i-lucide-x"
            class="absolute end-1 top-1 rounded-full"
            :loading="removingId === img.id"
            aria-label="حذف تصویر"
            @click="removeGallery(img.id)"
          />
        </li>
      </ul>
    </AppSection>
  </div>
</template>
