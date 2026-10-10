<script setup lang="ts">
import type { AdminUser } from '~~/shared/types/moderation'
import { USER_STATUS_LABELS } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const users = ref<AdminUser[]>([])
const q = ref('')
const error = ref('')

async function load() {
  try {
    const res = await $fetch<{ data: { users: AdminUser[] } }>('/api/admin/users', { query: { q: q.value || undefined } })
    users.value = res.data.users
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'خطا')
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-semibold">کاربران</h1>
    <form class="mt-4 flex gap-2" @submit.prevent="load">
      <UInput v-model="q" class="flex-1" placeholder="ایمیل یا نام" />
      <UButton type="submit" color="neutral" variant="outline">جستجو</UButton>
    </form>
    <p v-if="error" class="mt-4 text-sm text-terracotta-700">{{ error }}</p>
    <ul class="mt-6 divide-y divide-ink-100 text-sm">
      <li v-for="u in users" :key="u.id" class="py-3">
        <NuxtLink :to="`/admin/users/${u.id}`" class="flex justify-between gap-3">
          <span>{{ u.displayName }} · {{ u.email }}</span>
          <span class="text-ink-500">{{ USER_STATUS_LABELS[u.status] }} · {{ u.role }}</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
