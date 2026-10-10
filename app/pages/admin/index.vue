<script setup lang="ts">
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

interface Overview {
  users: number
  providers: number
  openReports: number
  openDisputes: number
  pendingVerifications: number
}

const overview = ref<Overview | null>(null)
const error = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { overview: Overview } }>('/api/admin/overview')
    overview.value = res.data.overview
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'دسترسی مدیریت لازم است')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

const queue = computed(() => {
  const o = overview.value
  if (!o) return []
  return [
    { label: 'احراز هویت در صف', value: o.pendingVerifications, to: '/admin/verifications', icon: 'i-lucide-badge-check', urgent: o.pendingVerifications > 0 },
    { label: 'گزارش باز', value: o.openReports, to: '/admin/reports', icon: 'i-lucide-flag', urgent: o.openReports > 0 },
    { label: 'اختلاف باز', value: o.openDisputes, to: '/admin/disputes', icon: 'i-lucide-scale', urgent: o.openDisputes > 0 },
  ]
})

useHead({ title: 'مدیریت | پت‌یار' })
</script>

<template>
  <div class="max-w-content">
    <PageHeader title="مدیریت پت‌یار" description="اعداد زنده از پایگاه‌داده. کارهای باز را از همین‌جا دنبال کنید." />

    <SkeletonList v-if="loading" :rows="3" />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />

    <template v-else-if="overview">
      <h2 class="mb-2 text-sm font-semibold text-muted">صف کارها</h2>
      <ul class="grid gap-3 sm:grid-cols-3">
        <li v-for="item in queue" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="pressable surface flex items-center gap-3 p-4 transition-colors hover:border-forest-300"
            :class="item.urgent && 'ring-terracotta-300 bg-terracotta-50/40'"
          >
            <span class="flex size-11 shrink-0 items-center justify-center rounded-full" :class="item.urgent ? 'bg-terracotta-100 text-terracotta-700' : 'bg-canvas-deep text-muted'" aria-hidden="true">
              <UIcon :name="item.icon" class="size-5" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-2xl font-extrabold text-highlighted"><span class="num">{{ formatNumber(item.value) }}</span></span>
              <span class="block text-sm text-muted">{{ item.label }}</span>
            </span>
            <UIcon name="i-lucide-chevron-left" class="size-4 text-ink-300" aria-hidden="true" />
          </NuxtLink>
        </li>
      </ul>

      <h2 class="mt-8 mb-2 text-sm font-semibold text-muted">کل سامانه</h2>
      <ul class="grid grid-cols-2 gap-3">
        <li>
          <NuxtLink to="/admin/users" class="pressable surface block p-4 transition-colors hover:border-forest-300">
            <span class="flex items-center gap-2 text-sm text-muted"><UIcon name="i-lucide-users" class="size-4" aria-hidden="true" />کاربران</span>
            <span class="mt-1 block text-2xl font-extrabold text-highlighted"><span class="num">{{ formatNumber(overview.users) }}</span></span>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/admin/providers" class="pressable surface block p-4 transition-colors hover:border-forest-300">
            <span class="flex items-center gap-2 text-sm text-muted"><UIcon name="i-lucide-store" class="size-4" aria-hidden="true" />پرونده ارائه‌دهنده</span>
            <span class="mt-1 block text-2xl font-extrabold text-highlighted"><span class="num">{{ formatNumber(overview.providers) }}</span></span>
          </NuxtLink>
        </li>
      </ul>
    </template>
  </div>
</template>
