<script setup lang="ts">
import type { AdminUser } from '~~/shared/types/moderation'
import { USER_STATUS_LABELS } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const route = useRoute()
const user = ref<AdminUser | null>(null)
const reason = ref('')
const error = ref('')
const pending = ref(false)

async function load() {
  const res = await $fetch<{ data: { user: AdminUser } }>(`/api/admin/users/${route.params.id}`)
  user.value = res.data.user
}

async function act(path: string) {
  if (reason.value.trim().length < 3) return
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { user: AdminUser } }>(path, { method: 'POST', body: { reason: reason.value } })
    user.value = res.data.user
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'خطا')
  }
  finally {
    pending.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-10">
    <NuxtLink to="/admin/users" class="text-sm text-ink-600">کاربران</NuxtLink>
    <template v-if="user">
      <h1 class="mt-3 text-2xl font-semibold">{{ user.displayName }}</h1>
      <p class="mt-2 text-sm" dir="ltr">{{ user.email }}</p>
      <p class="mt-2 text-sm">{{ USER_STATUS_LABELS[user.status] }} · {{ user.role }}</p>
      <UTextarea v-model="reason" class="mt-6 w-full" :rows="3" placeholder="دلیل اقدام" />
      <p v-if="error" class="mt-2 text-sm text-terracotta-700">{{ error }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <UButton :loading="pending" color="neutral" variant="outline" @click="act(`/api/admin/users/${user.id}/suspend`)">مسدود</UButton>
        <UButton :loading="pending" color="neutral" variant="outline" @click="act(`/api/admin/users/${user.id}/deactivate`)">غیرفعال</UButton>
        <UButton :loading="pending" @click="act(`/api/admin/users/${user.id}/activate`)">فعال‌سازی</UButton>
      </div>
    </template>
  </div>
</template>
