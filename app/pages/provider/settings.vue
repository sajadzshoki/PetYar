<script setup lang="ts">
import type { PublicUser } from '~~/shared/types/user'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const { fetch: refreshSession } = useUserSession()
const toast = useToast()
const user = ref<PublicUser | null>(null)
const loading = ref(true)
const pending = ref(false)
const error = ref('')
const loadError = ref('')

const form = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  bio: '',
})

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await $fetch<{ data: { user: PublicUser } }>('/api/profile')
    user.value = res.data.user
    form.firstName = res.data.user.firstName
    form.lastName = res.data.user.lastName
    form.phone = res.data.user.phone || ''
    form.bio = res.data.user.bio || ''
  }
  catch (err) {
    loadError.value = apiErrorMessage(err, 'بارگذاری ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

async function save() {
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { user: PublicUser } }>('/api/profile', { method: 'PATCH', body: { ...form } })
    user.value = res.data.user
    await refreshSession()
    toast.add({ title: 'ذخیره شد', icon: 'i-lucide-check', color: 'success' })
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'ذخیره ناموفق بود')
  }
  finally {
    pending.value = false
  }
}

onMounted(load)

useHead({ title: 'حساب کاربری | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-narrow px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="حساب کاربری" description="اطلاعات ورود و تماس. برای آنچه مشتری‌ها می‌بینند، پرونده عمومی را ویرایش کنید." />

    <SkeletonList v-if="loading" :rows="2" />
    <AppState v-else-if="loadError" variant="error" :title="loadError" retry @retry="load" />

    <form v-else class="space-y-5" @submit.prevent="save">
      <div class="surface flex items-center justify-between gap-3 p-4">
        <div class="min-w-0">
          <p class="text-sm font-bold text-highlighted">حالت نمایش</p>
          <p class="text-xs leading-5 text-muted">روشن یا تیره. انتخاب شما روی همین دستگاه می‌ماند.</p>
        </div>
        <ThemeToggle />
      </div>

      <AppSection title="ورود">
        <dl class="text-sm">
          <dt class="text-xs text-muted">ایمیل</dt>
          <dd class="ltr mt-0.5 font-medium text-highlighted">{{ user?.email }}</dd>
        </dl>
        <p class="mt-2 text-xs text-muted">ایمیل هویت ورود است و از اینجا عوض نمی‌شود.</p>
      </AppSection>

      <AppSection title="اطلاعات تماس">
        <div class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="نام" name="firstName">
              <UInput v-model="form.firstName" class="w-full" autocomplete="given-name" />
            </UFormField>
            <UFormField label="نام خانوادگی" name="lastName">
              <UInput v-model="form.lastName" class="w-full" autocomplete="family-name" />
            </UFormField>
          </div>
          <UFormField label="تلفن" name="phone">
            <UInput v-model="form.phone" class="w-full ltr" type="tel" inputmode="tel" autocomplete="tel" placeholder="09xxxxxxxxx" />
          </UFormField>
          <UFormField label="درباره شما" name="bio" help="یادداشت شخصی؛ در پرونده عمومی نمایش داده نمی‌شود.">
            <UTextarea v-model="form.bio" class="w-full" :rows="3" />
          </UFormField>
        </div>
      </AppSection>

      <InlineMessage :message="error" />
      <UButton type="submit" block :loading="pending" icon="i-lucide-check">ذخیره</UButton>
    </form>

    <ListRow to="/provider/profile" class="surface mt-6">
      <template #leading>
        <span class="flex size-10 items-center justify-center rounded-full bg-forest-50 text-primary" aria-hidden="true">
          <UIcon name="i-lucide-store" class="size-5" />
        </span>
      </template>
      <p class="font-semibold text-highlighted">ویرایش پرونده عمومی</p>
      <p class="text-sm text-muted">نام نمایشی، معرفی، محل خدمات و گالری</p>
    </ListRow>
  </div>
</template>
