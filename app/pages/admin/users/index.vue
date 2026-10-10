<script setup lang="ts">
import type { AdminUser } from '~~/shared/types/moderation'
import { USER_STATUS_LABELS } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const users = ref<AdminUser[]>([])
const q = ref('')
const error = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { users: AdminUser[] } }>('/api/admin/users', { query: { q: q.value || undefined } })
    users.value = res.data.users
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری کاربران ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

useHead({ title: 'کاربران | مدیریت پت‌یار' })
</script>

<template>
  <div class="max-w-content">
    <PageHeader title="کاربران" compact />

    <form class="mb-4 flex gap-2" role="search" @submit.prevent="load">
      <UInput v-model="q" class="flex-1" placeholder="ایمیل یا نام" icon="i-lucide-search" aria-label="جستجوی کاربر" />
      <UButton type="submit" color="neutral" variant="outline">جستجو</UButton>
    </form>

    <SkeletonList v-if="loading" :rows="5" avatar />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />
    <AppState v-else-if="!users.length" icon="i-lucide-users" title="کاربری پیدا نشد" compact />
    <ul v-else class="surface divide-y divide-muted">
      <li v-for="u in users" :key="u.id">
        <ListRow :to="`/admin/users/${u.id}`">
          <template #leading>
            <MediaThumb :initial="initialOf(u.displayName)" :alt="u.displayName" size-class="size-10" rounded="full" />
          </template>
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p class="font-semibold text-highlighted">{{ u.displayName }}</p>
            <UBadge color="neutral" variant="subtle" size="sm" class="rounded-full">{{ USER_ROLE_LABELS[u.role] || u.role }}</UBadge>
          </div>
          <p class="truncate text-sm text-muted"><span class="ltr">{{ u.email }}</span></p>
          <template #trailing>
            <StatusBadge :label="USER_STATUS_LABELS[u.status]" :meta="USER_STATUS_META[u.status]" size="sm" class="shrink-0" />
          </template>
        </ListRow>
      </li>
    </ul>
  </div>
</template>
