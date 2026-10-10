<script setup lang="ts">
import type { PublicUser } from '~~/shared/types/user'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const { fetch: refreshSession, user: sessionUser, clear } = useUserSession()
const toast = useToast()
const user = ref<PublicUser | null>(null)
const loading = ref(true)
const loadError = ref('')
const saveError = ref('')
const pending = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const form = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  bio: '',
})

const role = computed(() => sessionUser.value?.role)
const isProvider = computed(() => role.value === 'PROVIDER' || role.value === 'ADMIN')
const isAdmin = computed(() => role.value === 'ADMIN')

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
  catch (error) {
    loadError.value = apiErrorMessage(error, 'بارگذاری پروفایل ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

async function save() {
  pending.value = true
  saveError.value = ''
  try {
    const res = await $fetch<{ data: { user: PublicUser } }>('/api/profile', {
      method: 'PATCH',
      body: { ...form },
    })
    user.value = res.data.user
    await refreshSession()
    toast.add({ title: 'تغییرات ذخیره شد', icon: 'i-lucide-circle-check', color: 'success' })
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
    toast.add({ title: 'تصویر پروفایل به‌روز شد', icon: 'i-lucide-circle-check', color: 'success' })
  }
  catch (error) {
    saveError.value = apiErrorMessage(error, 'آپلود تصویر ناموفق بود')
  }
  finally {
    uploading.value = false
    input.value = ''
  }
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/')
}

const links = computed(() => {
  const items = [
    { to: '/pets', label: 'حیوانات من', description: 'پرونده سلامت، واکسن و داروها', icon: 'i-lucide-paw-print' },
    { to: '/bookings', label: 'رزروهای من', description: 'تاریخچه و وضعیت رزروها', icon: 'i-lucide-calendar-check' },
    { to: '/favorites', label: 'ذخیره‌شده‌ها', description: 'ارائه‌دهندگانی که نشان کرده‌اید', icon: 'i-lucide-heart' },
    { to: '/notifications', label: 'اعلان‌ها', description: 'به‌روزرسانی رزرو و پیام', icon: 'i-lucide-bell' },
    { to: '/report', label: 'گزارش تخلف', description: 'گزارش‌های شما به تیم ایمنی', icon: 'i-lucide-flag' },
  ]
  return items
})

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="پروفایل" eyebrow="حساب شما" description="نام، تماس و تصویرتان را اینجا مدیریت کنید." />

    <SkeletonList v-if="loading" :rows="2" />
    <AppState v-else-if="loadError" variant="error" :title="loadError" retry @retry="load" />

    <div v-else-if="user" class="space-y-6">
      <!-- Identity card -->
      <AppSection>
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="group relative shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-primary"
            :aria-label="uploading ? 'در حال آپلود تصویر' : 'تغییر تصویر پروفایل'"
            :disabled="uploading"
            @click="fileInput?.click()"
          >
            <MediaThumb :src="user.avatarUrl" :initial="initialOf(user.displayName)" size-class="size-20" rounded="full" />
            <span class="absolute -bottom-0.5 -end-0.5 flex size-7 items-center justify-center rounded-full border-2 border-paper bg-primary text-white">
              <UIcon :name="uploading ? 'i-lucide-loader' : 'i-lucide-camera'" class="size-3.5" :class="uploading && 'animate-spin'" aria-hidden="true" />
            </span>
          </button>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onAvatar">
          <div class="min-w-0">
            <p class="truncate text-lg font-bold text-highlighted">{{ user.displayName }}</p>
            <p class="ltr truncate text-sm text-muted">{{ user.email }}</p>
            <UBadge color="neutral" variant="subtle" size="sm" class="mt-1.5 rounded-full">{{ USER_ROLE_LABELS[user.role] }}</UBadge>
          </div>
        </div>
      </AppSection>

      <!-- Workspaces -->
      <div class="grid gap-3 sm:grid-cols-2">
        <NuxtLink
          to="/provider"
          class="pressable surface flex items-center gap-3 p-4 transition-colors hover:border-forest-300"
        >
          <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-primary">
            <UIcon name="i-lucide-briefcase" class="size-5" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-bold text-highlighted">{{ isProvider ? 'کارتابل ارائه‌دهنده' : 'ارائه‌دهنده شوید' }}</span>
            <span class="block text-xs leading-5 text-muted">{{ isProvider ? 'رزروها، تقویم و خدمات شما' : 'خدمات خود را به صاحبان حیوانات ارائه دهید' }}</span>
          </span>
          <UIcon name="i-lucide-chevron-left" class="size-5 text-ink-300" aria-hidden="true" />
        </NuxtLink>
        <NuxtLink
          v-if="isAdmin"
          to="/admin"
          class="pressable surface flex items-center gap-3 p-4 transition-colors hover:border-forest-300"
        >
          <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-terracotta-50 text-terracotta-700">
            <UIcon name="i-lucide-shield-check" class="size-5" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-bold text-highlighted">مدیریت پت‌یار</span>
            <span class="block text-xs leading-5 text-muted">احراز، گزارش‌ها و اختلاف‌ها</span>
          </span>
          <UIcon name="i-lucide-chevron-left" class="size-5 text-ink-300" aria-hidden="true" />
        </NuxtLink>
      </div>

      <!-- Links -->
      <AppSection flush title="بخش‌های من">
        <ul class="divide-y divide-muted border-t border-muted">
          <li v-for="item in links" :key="item.to">
            <ListRow :to="item.to">
              <template #leading>
                <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-canvas-deep text-toned">
                  <UIcon :name="item.icon" class="size-5" aria-hidden="true" />
                </span>
              </template>
              <p class="text-sm font-semibold text-highlighted">{{ item.label }}</p>
              <p class="text-xs text-muted">{{ item.description }}</p>
            </ListRow>
          </li>
        </ul>
      </AppSection>

      <!-- Profile form -->
      <AppSection title="اطلاعات شخصی" description="این اطلاعات فقط برای حساب شما و ارتباط ارائه‌دهنده استفاده می‌شود.">
        <form class="space-y-5" @submit.prevent="save">
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="نام" name="firstName">
              <UInput v-model="form.firstName" class="w-full" autocomplete="given-name" />
            </UFormField>
            <UFormField label="نام خانوادگی" name="lastName">
              <UInput v-model="form.lastName" class="w-full" autocomplete="family-name" />
            </UFormField>
          </div>
          <UFormField label="شماره تماس" name="phone" help="برای هماهنگی ارائه‌دهنده در زمان رزرو">
            <UInput v-model="form.phone" class="w-full" dir="ltr" type="tel" inputmode="tel" autocomplete="tel" placeholder="09xxxxxxxxx" icon="i-lucide-phone" />
          </UFormField>
          <UFormField label="درباره شما" name="bio">
            <UTextarea v-model="form.bio" class="w-full" :rows="4" placeholder="مثلاً: دو گربه دارم و دنبال پرستار مطمئن هستم." />
          </UFormField>
          <p class="text-xs text-muted">ایمیل ورود قابل تغییر نیست: <span class="ltr">{{ user.email }}</span></p>
          <InlineMessage :message="saveError" />
          <div class="flex justify-end">
            <UButton type="submit" :loading="pending" icon="i-lucide-check">ذخیره تغییرات</UButton>
          </div>
        </form>
      </AppSection>

      <div class="flex justify-center pt-2">
        <UButton color="error" variant="ghost" icon="i-lucide-log-out" @click="logout">خروج از حساب</UButton>
      </div>
    </div>
  </div>
</template>
