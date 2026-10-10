<script setup lang="ts">
import type { VerificationApplication } from '~~/shared/types/moderation'
import { VERIFICATION_STATUS_LABELS } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const applications = ref<VerificationApplication[]>([])
const error = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { applications: VerificationApplication[] } }>('/api/admin/verifications')
    applications.value = res.data.applications
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

const sorted = computed(() =>
  [...applications.value].sort((a, b) => {
    const rank = (s: string) => (s === 'PENDING' ? 0 : s === 'NEEDS_CHANGES' ? 1 : 2)
    return rank(a.status) - rank(b.status) || (b.submittedAt || b.createdAt).localeCompare(a.submittedAt || a.createdAt)
  }),
)

useHead({ title: 'احراز هویت | مدیریت پت‌یار' })
</script>

<template>
  <div class="max-w-content">
    <PageHeader title="احراز هویت" description="درخواست‌های در صف بالاتر نمایش داده می‌شوند." compact />

    <SkeletonList v-if="loading" :rows="4" avatar />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />
    <AppState v-else-if="!sorted.length" icon="i-lucide-badge-check" title="درخواستی نیست" compact />
    <ul v-else class="surface divide-y divide-muted">
      <li v-for="item in sorted" :key="item.id">
        <ListRow :to="`/admin/verifications/${item.id}`">
          <template #leading>
            <MediaThumb :initial="initialOf(item.providerName)" :alt="item.providerName" size-class="size-10" rounded="lg" />
          </template>
          <p class="font-semibold text-highlighted">{{ item.providerName }}</p>
          <p class="mt-0.5 truncate text-sm text-muted">
            {{ item.legalName || 'بدون نام حقوقی' }} · <span class="num">{{ formatNumber(item.documents.length) }}</span> مدرک
            <template v-if="item.submittedAt"> · {{ formatRelative(item.submittedAt) }}</template>
          </p>
          <template #trailing>
            <StatusBadge :label="VERIFICATION_STATUS_LABELS[item.status]" :meta="VERIFICATION_STATUS_META[item.status]" size="sm" class="shrink-0" />
          </template>
        </ListRow>
      </li>
    </ul>
  </div>
</template>
