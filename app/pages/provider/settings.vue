<script setup lang="ts">
import type { PublicUser } from '~~/shared/types/user'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const { fetch: refreshSession } = useUserSession()
const user = ref<PublicUser | null>(null)
const pending = ref(false)
const error = ref('')
const ok = ref('')

const form = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  bio: '',
})

async function load() {
  const res = await $fetch<{ data: { user: PublicUser } }>('/api/profile')
  user.value = res.data.user
  form.firstName = res.data.user.firstName
  form.lastName = res.data.user.lastName
  form.phone = res.data.user.phone || ''
  form.bio = res.data.user.bio || ''
}

async function save() {
  pending.value = true
  error.value = ''
  ok.value = ''
  try {
    const res = await $fetch<{ data: { user: PublicUser } }>('/api/profile', { method: 'PATCH', body: { ...form } })
    user.value = res.data.user
    await refreshSession()
    ok.value = 'ذخیره شد'
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'ذخیره ناموفق بود')
  }
  finally {
    pending.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-10">
    <h1 class="text-2xl font-semibold">حساب کاربری</h1>
    <p class="mt-2 text-sm leading-7 text-ink-600">ایمیل هویت ورود است و از اینجا عوض نمی‌شود. پرونده عمومی جداست.</p>
    <form class="mt-8 space-y-4" @submit.prevent="save">
      <p v-if="user" class="text-sm text-ink-500" dir="ltr">{{ user.email }}</p>
      <UFormField label="نام">
        <UInput v-model="form.firstName" class="w-full" />
      </UFormField>
      <UFormField label="نام خانوادگی">
        <UInput v-model="form.lastName" class="w-full" />
      </UFormField>
      <UFormField label="تلفن">
        <UInput v-model="form.phone" class="w-full" dir="ltr" />
      </UFormField>
      <UFormField label="درباره شما">
        <UTextarea v-model="form.bio" class="w-full" />
      </UFormField>
      <p v-if="error" class="text-sm text-terracotta-700">{{ error }}</p>
      <p v-if="ok" class="text-sm text-forest-700">{{ ok }}</p>
      <UButton type="submit" :loading="pending">ذخیره</UButton>
    </form>
    <p class="mt-8 text-sm">
      <NuxtLink to="/provider/profile" class="text-terracotta-700">ویرایش پرونده عمومی</NuxtLink>
    </p>
  </div>
</template>
