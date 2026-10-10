<script setup lang="ts">
definePageMeta({ middleware: 'guest' })

const email = ref('')
const password = ref('')
const pending = ref(false)
const errorMessage = ref('')
const { fetch: refreshSession } = useUserSession()

async function submit() {
  pending.value = true
  errorMessage.value = ''
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await refreshSession()
    await navigateTo('/account')
  }
  catch (error: unknown) {
    const err = error as { data?: { error?: { message?: string }, data?: { error?: { message?: string } }, statusMessage?: string } }
    errorMessage.value = err.data?.error?.message || err.data?.data?.error?.message || err.data?.statusMessage || 'ورود ناموفق بود'
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md px-4 py-12 sm:py-16">
    <h1 class="text-2xl font-semibold">ورود به پت‌یار</h1>
    <p class="mt-2 text-sm text-ink-600">با ایمیلی که ثبت کرده‌اید وارد شوید.</p>

    <form class="mt-8 space-y-4" @submit.prevent="submit">
      <UFormField label="ایمیل" name="email">
        <UInput v-model="email" type="email" autocomplete="email" class="w-full" />
      </UFormField>
      <UFormField label="رمز عبور" name="password">
        <UInput v-model="password" type="password" autocomplete="current-password" class="w-full" />
      </UFormField>
      <p v-if="errorMessage" class="text-sm text-terracotta-700">{{ errorMessage }}</p>
      <UButton type="submit" block :loading="pending">ورود</UButton>
    </form>

    <p class="mt-6 text-sm text-ink-600">
      حساب ندارید؟
      <NuxtLink to="/register" class="text-terracotta-700 underline-offset-4 hover:underline">ثبت‌نام</NuxtLink>
    </p>
  </div>
</template>
