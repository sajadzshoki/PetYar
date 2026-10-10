<script setup lang="ts">
import type { UserRole } from '~~/shared/constants/roles'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'guest', layout: 'auth' })

const displayName = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const role = ref<Exclude<UserRole, 'ADMIN'>>('OWNER')
const pending = ref(false)
const errorMessage = ref('')
const { fetch: refreshSession } = useUserSession()

const roles: Array<{ value: Exclude<UserRole, 'ADMIN'>, label: string, description: string, icon: string }> = [
  { value: 'OWNER', label: 'صاحب حیوان خانگی', description: 'جستجو، رزرو و مدیریت پرونده حیوان', icon: 'i-lucide-paw-print' },
  { value: 'PROVIDER', label: 'ارائه‌دهنده خدمات', description: 'ساخت پرونده، تعریف خدمت و دریافت رزرو', icon: 'i-lucide-briefcase' },
]

const passwordTooShort = computed(() => password.value.length > 0 && password.value.length < 8)
const canSubmit = computed(() => displayName.value.trim().length >= 2 && email.value.trim().length > 3 && password.value.length >= 8)

async function submit() {
  if (!canSubmit.value) return
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
    await navigateTo(role.value === 'PROVIDER' ? '/provider' : '/account')
  }
  catch (error: unknown) {
    errorMessage.value = apiErrorMessage(error, 'ثبت‌نام ناموفق بود')
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-narrow">
    <div class="surface p-5 sm:p-8">
      <h1 class="text-2xl font-bold">ساخت حساب</h1>
      <p class="mt-1.5 text-sm leading-7 text-muted">رایگان است و کمتر از یک دقیقه طول می‌کشد.</p>

      <form class="mt-7 space-y-5" novalidate @submit.prevent="submit">
        <fieldset>
          <legend class="mb-2 text-sm font-semibold text-highlighted">چطور از پت‌یار استفاده می‌کنید؟</legend>
          <div class="grid gap-2 sm:grid-cols-2">
            <label
              v-for="option in roles"
              :key="option.value"
              class="pressable flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary"
              :class="role === option.value ? 'border-primary bg-forest-50' : 'border-default bg-paper hover:border-accented'"
            >
              <input v-model="role" type="radio" name="role" :value="option.value" class="sr-only">
              <UIcon :name="option.icon" class="mt-0.5 size-5 shrink-0" :class="role === option.value ? 'text-primary' : 'text-muted'" aria-hidden="true" />
              <span class="min-w-0">
                <span class="block text-sm font-bold text-highlighted">{{ option.label }}</span>
                <span class="mt-0.5 block text-xs leading-5 text-muted">{{ option.description }}</span>
              </span>
            </label>
          </div>
        </fieldset>

        <UFormField label="نام نمایشی" name="displayName" required help="همین نام را دیگران می‌بینند.">
          <UInput v-model="displayName" autocomplete="name" class="w-full" icon="i-lucide-user-round" />
        </UFormField>
        <UFormField label="ایمیل" name="email" required>
          <UInput v-model="email" type="email" autocomplete="email" inputmode="email" dir="ltr" class="w-full" icon="i-lucide-mail" placeholder="you@example.com" />
        </UFormField>
        <UFormField
          label="رمز عبور"
          name="password"
          required
          :error="passwordTooShort ? 'رمز عبور باید حداقل ۸ کاراکتر باشد' : undefined"
          :help="passwordTooShort ? undefined : 'حداقل ۸ کاراکتر'"
        >
          <UInput
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
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
        <UButton type="submit" block size="xl" :loading="pending" :disabled="!canSubmit">ثبت‌نام</UButton>
      </form>
    </div>

    <p class="mt-6 text-center text-sm text-muted">
      قبلاً حساب دارید؟
      <NuxtLink to="/login" class="font-semibold text-primary underline-offset-4 hover:underline">وارد شوید</NuxtLink>
    </p>
  </div>
</template>
