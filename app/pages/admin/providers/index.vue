<script setup lang="ts">
import { VERIFICATION_STATUS_LABELS, type VerificationStatus } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

interface Row {
  id: string
  displayName: string
  email: string
  city: string | null
  isActive: boolean
  verificationStatus: VerificationStatus
}

const providers = ref<Row[]>([])
const error = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { providers: Row[] } }>('/api/admin/providers')
    providers.value = res.data.providers
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

useHead({ title: 'ارائه‌دهندگان | مدیریت پت‌یار' })
</script>

<template>
  <div class="max-w-content">
    <PageHeader title="ارائه‌دهندگان" compact />

    <SkeletonList v-if="loading" :rows="5" avatar />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />
    <AppState v-else-if="!providers.length" icon="i-lucide-store" title="پرونده‌ای ثبت نشده" compact />
    <ul v-else class="surface divide-y divide-muted">
      <li v-for="p in providers" :key="p.id">
        <ListRow :to="`/admin/providers/${p.id}`">
          <template #leading>
            <MediaThumb :initial="initialOf(p.displayName)" :alt="p.displayName" size-class="size-10" rounded="lg" />
          </template>
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p class="font-semibold text-highlighted">{{ p.displayName }}</p>
            <UBadge v-if="!p.isActive" color="neutral" variant="subtle" size="sm" class="rounded-full" icon="i-lucide-eye-off">پنهان</UBadge>
          </div>
          <p class="truncate text-sm text-muted"><span class="ltr">{{ p.email }}</span><template v-if="p.city"> · {{ p.city }}</template></p>
          <template #trailing>
            <StatusBadge :label="VERIFICATION_STATUS_LABELS[p.verificationStatus]" :meta="VERIFICATION_STATUS_META[p.verificationStatus]" size="sm" class="shrink-0" />
          </template>
        </ListRow>
      </li>
    </ul>
  </div>
</template>
