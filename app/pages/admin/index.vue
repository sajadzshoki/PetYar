<script setup lang="ts">
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const overview = ref<{
  users: number
  providers: number
  openReports: number
  openDisputes: number
  pendingVerifications: number
} | null>(null)
const error = ref('')
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await $fetch<{ data: { overview: NonNullable<typeof overview.value> } }>('/api/admin/overview')
    overview.value = res.data.overview
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'دسترسی مدیریت لازم است')
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-semibold">مدیریت پت‌یار</h1>
    <p class="mt-2 text-sm leading-7 text-ink-600">اعداد زنده از پایگاه‌داده. نشان ساختگی نیست.</p>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <p v-else-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
    <ul v-else-if="overview" class="mt-8 divide-y divide-ink-100 text-sm">
      <li class="flex justify-between py-3">
        <span>کاربران</span><span>{{ overview.users }}</span>
      </li>
      <li class="flex justify-between py-3">
        <span>پرونده ارائه‌دهنده</span><span>{{ overview.providers }}</span>
      </li>
      <li class="flex justify-between py-3">
        <NuxtLink to="/admin/verifications">احراز در صف</NuxtLink>
        <span>{{ overview.pendingVerifications }}</span>
      </li>
      <li class="flex justify-between py-3">
        <NuxtLink to="/admin/reports">گزارش باز</NuxtLink>
        <span>{{ overview.openReports }}</span>
      </li>
      <li class="flex justify-between py-3">
        <NuxtLink to="/admin/disputes">اختلاف باز</NuxtLink>
        <span>{{ overview.openDisputes }}</span>
      </li>
    </ul>
  </div>
</template>
