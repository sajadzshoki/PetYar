<script setup lang="ts">
import type { PublicUser } from '~~/shared/types/user'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const { fetch: refreshSession } = useUserSession()
const user = ref<PublicUser | null>(null)
const loadError = ref('')
const saveError = ref('')
const saveOk = ref('')
const pending = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const form = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  bio: '',
})

async function load() {
  loadError.value = ''
  try {
    const res = await $fetch<{ data: { user: PublicUser } }>('/api/profile')
    user.value = res.data.user
    form.firstName = res.data.user.firstName
    form.lastName = res.data.user.lastName
    form.phone = res.data.user.phone || ''
    form.bio = res.data.user.bio || ''
  }
  catch (error) {
    loadError.value = apiErrorMessage(error, 'بارگذاری پروفایل ناموفق بود')
  }
}

async function save() {
  pending.value = true
  saveError.value = ''
  saveOk.value = ''
  try {
    const res = await $fetch<{ data: { user: PublicUser } }>('/api/profile', {
      method: 'PATCH',
      body: { ...form },
    })
    user.value = res.data.user
    await refreshSession()
    saveOk.value = 'تغییرات ذخیره شد'
  }
  catch (error) {
    saveError.value = apiErrorMessage(error, 'ذخیره ناموفق بود')
  }
  finally {
    pending.value = false
  }
}

async function onAvatar(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  saveError.value = ''
  try {
    const body = new FormData()
    body.append('file', file)
    const res = await $fetch<{ data: { user: PublicUser } }>('/api/profile/avatar', {
      method: 'POST',
      body,
    })
    user.value = res.data.user
    saveOk.value = 'تصویر پروفایل به‌روز شد'
  }
  catch (error) {
    saveError.value = apiErrorMessage(error, 'آپلود تصویر ناموفق بود')
  }
  finally {
    uploading.value = false
    input.value = ''
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-12">
    <p class="text-sm text-forest-700">حساب شما</p>
    <h1 class="mt-1 text-2xl font-semibold">پروفایل</h1>
    <p class="mt-2 text-sm leading-7 text-ink-600">
      نام، تماس و تصویرتان فقط برای خودتان و استفاده‌های بعدی پت‌یار است.
    </p>

    <AppState v-if="!user && !loadError" title="در حال بارگذاری…" />
    <AppState v-else-if="loadError" :title="loadError">
      <UButton to="/login">ورود</UButton>
    </AppState>

    <div v-else class="mt-8">
      <div class="flex items-center gap-4">
        <button
          type="button"
          class="h-20 w-20 overflow-hidden border border-ink-200 bg-canvas-deep"
          aria-label="تغییر تصویر"
          @click="fileInput?.click()"
        >
          <img
            v-if="user?.avatarUrl"
            :src="user.avatarUrl"
            alt=""
            class="h-full w-full object-cover"
          >
          <span v-else class="flex h-full w-full items-center justify-center text-ink-400">
            <UIcon name="i-lucide-user" class="size-8" />
          </span>
        </button>
        <div>
          <p class="text-sm font-medium">{{ user?.displayName }}</p>
          <p class="mt-1 text-sm text-ink-500">{{ user?.email }}</p>
          <button type="button" class="mt-2 text-sm text-terracotta-700" @click="fileInput?.click()">
            {{ uploading ? 'در حال آپلود…' : 'تغییر تصویر' }}
          </button>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onAvatar">
        </div>
      </div>

      <form class="mt-8 space-y-4" @submit.prevent="save">
        <UFormField label="نام" name="firstName">
          <UInput v-model="form.firstName" class="w-full" autocomplete="given-name" />
        </UFormField>
        <UFormField label="نام خانوادگی" name="lastName">
          <UInput v-model="form.lastName" class="w-full" autocomplete="family-name" />
        </UFormField>
        <UFormField label="شماره تماس" name="phone">
          <UInput v-model="form.phone" class="w-full" dir="ltr" autocomplete="tel" />
        </UFormField>
        <UFormField label="درباره شما" name="bio">
          <UTextarea v-model="form.bio" class="w-full" :rows="4" />
        </UFormField>
        <p class="text-sm text-ink-500">ایمیل ورود قابل تغییر نیست: {{ user?.email }}</p>
        <p v-if="saveError" class="text-sm text-terracotta-700">{{ saveError }}</p>
        <p v-if="saveOk" class="text-sm text-forest-700">{{ saveOk }}</p>
        <UButton type="submit" :loading="pending">ذخیره پروفایل</UButton>
      </form>

      <p class="mt-10">
        <NuxtLink to="/pets" class="text-sm text-terracotta-700">حیوانات خانگی من</NuxtLink>
      </p>
    </div>
  </div>
</template>
