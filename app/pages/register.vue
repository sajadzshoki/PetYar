<script setup lang="ts">
import type { UserRole } from '../../shared/constants/roles'

definePageMeta({ middleware: 'guest' })

const displayName = ref('')
const email = ref('')
const password = ref('')
const role = ref<Exclude<UserRole, 'ADMIN'>>('OWNER')
const pending = ref(false)
const errorMessage = ref('')
const { fetch: refreshSession } = useUserSession()

async function submit() {
  pending.value = true
  errorMessage.value = ''
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        displayName: displayName.value,
        email: email.value,
        password: password.value,
        role: role.value,
      },
    })
    await refreshSession()
    await navigateTo('/account')
  }
  catch (error: unknown) {
    const err = error as { data?: { error?: { message?: string }, data?: { error?: { message?: string } }, statusMessage?: string } }
    errorMessage.value = err.data?.error?.message || err.data?.data?.error?.message || err.data?.statusMessage || 'ثبت‌نام ناموفق بود'
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md px-4 py-12 sm:py-16">
    <h1 class="text-2xl font-semibold">ساخت حساب</h1>
    <p class="mt-2 text-sm text-ink-600">نقش خود را انتخاب کنید. نقش مدیر از این فرم ساخته نمی‌شود.</p>

    <form class="mt-8 space-y-4" @submit.prevent="submit">
      <UFormField label="نام نمایشی" name="displayName">
        <UInput v-model="displayName" autocomplete="name" class="w-full" />
      </UFormField>
      <UFormField label="ایمیل" name="email">
        <UInput v-model="email" type="email" autocomplete="email" class="w-full" />
      </UFormField>
      <UFormField label="رمز عبور" name="password">
        <UInput v-model="password" type="password" autocomplete="new-password" class="w-full" />
      </UFormField>
      <UFormField label="نقش" name="role">
        <USelect
          v-model="role"
          :items="[
            { label: 'صاحب حیوان خانگی', value: 'OWNER' },
            { label: 'ارائه‌دهنده خدمات', value: 'PROVIDER' },
          ]"
          class="w-full"
        />
      </UFormField>
      <p v-if="errorMessage" class="text-sm text-terracotta-700">{{ errorMessage }}</p>
      <UButton type="submit" block :loading="pending">ثبت‌نام</UButton>
    </form>

    <p class="mt-6 text-sm text-ink-600">
      قبلاً حساب دارید؟
      <NuxtLink to="/login" class="text-terracotta-700 underline-offset-4 hover:underline">ورود</NuxtLink>
    </p>
  </div>
</template>
