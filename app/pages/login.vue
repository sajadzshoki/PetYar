<script setup lang="ts">
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'guest', layout: 'auth' })

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const pending = ref(false)
const errorMessage = ref('')
const { fetch: refreshSession } = useUserSession()

const canSubmit = computed(() => email.value.trim().length > 3 && password.value.length > 0)

async function submit() {
  if (!canSubmit.value) return
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
    errorMessage.value = apiErrorMessage(error, 'ورود ناموفق بود')
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-narrow">
    <div class="surface p-5 sm:p-8">
      <h1 class="text-2xl font-bold">ورود به پت‌یار</h1>
      <p class="mt-1.5 text-sm leading-7 text-muted">با ایمیلی که ثبت کرده‌اید وارد شوید.</p>

      <form class="mt-7 space-y-5" novalidate @submit.prevent="submit">
        <UFormField label="ایمیل" name="email" required>
          <UInput
            v-model="email"
            type="email"
            autocomplete="email"
            inputmode="email"
            dir="ltr"
            class="w-full"
            icon="i-lucide-mail"
            placeholder="you@example.com"
            autofocus
          />
        </UFormField>
        <UFormField label="رمز عبور" name="password" required>
          <UInput
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            dir="ltr"
            class="w-full"
            icon="i-lucide-lock"
            :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
        </UFormField>
        <InlineMessage :message="errorMessage" />
        <UButton type="submit" block size="xl" :loading="pending" :disabled="!canSubmit">ورود</UButton>
      </form>
    </div>

    <p class="mt-6 text-center text-sm text-muted">
      حساب ندارید؟
      <NuxtLink to="/register" class="font-semibold text-primary underline-offset-4 hover:underline">ثبت‌نام کنید</NuxtLink>
    </p>
  </div>
</template>
