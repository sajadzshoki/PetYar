<script setup lang="ts">
import type { AdminUser } from '~~/shared/types/moderation'
import { USER_STATUS_LABELS } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const route = useRoute()
const toast = useToast()
const user = ref<AdminUser | null>(null)
const reason = ref('')
const error = ref('')
const loadError = ref('')
const loading = ref(true)
const pending = ref(false)

type Action = 'suspend' | 'deactivate' | 'activate'
const confirm = ref<Action | null>(null)

const ACTIONS: Record<Action, { label: string, title: string, description: string, color: 'error' | 'neutral' | 'primary', icon: string }> = {
  suspend: { label: 'مسدود', title: 'مسدود کردن کاربر', description: 'کاربر تا رفع مسدودی نمی‌تواند وارد شود. دلیل در دفتر ممیزی ثبت می‌شود.', color: 'error', icon: 'i-lucide-ban' },
  deactivate: { label: 'غیرفعال', title: 'غیرفعال کردن کاربر', description: 'حساب غیرفعال می‌شود و از فهرست‌ها حذف می‌گردد.', color: 'neutral', icon: 'i-lucide-circle-off' },
  activate: { label: 'فعال‌سازی', title: 'فعال‌سازی کاربر', description: 'کاربر دوباره دسترسی کامل خواهد داشت.', color: 'primary', icon: 'i-lucide-check' },
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await $fetch<{ data: { user: AdminUser } }>(`/api/admin/users/${route.params.id}`)
    user.value = res.data.user
  }
  catch (err) {
    loadError.value = apiErrorMessage(err, 'کاربر یافت نشد')
  }
  finally {
    loading.value = false
  }
}

async function act() {
  if (!user.value || !confirm.value || reason.value.trim().length < 3) return
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { user: AdminUser } }>(`/api/admin/users/${user.value.id}/${confirm.value}`, { method: 'POST', body: { reason: reason.value } })
    user.value = res.data.user
    toast.add({ title: 'وضعیت کاربر به‌روز شد', icon: 'i-lucide-check', color: 'success' })
    confirm.value = null
    reason.value = ''
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'انجام نشد')
  }
  finally {
    pending.value = false
  }
}

onMounted(load)

useHead(() => ({ title: `${user.value?.displayName || 'کاربر'} | مدیریت پت‌یار` }))
</script>

<template>
  <div class="max-w-content">
    <PageHeader :title="user?.displayName || 'کاربر'" compact :back="{ to: '/admin/users', label: 'کاربران' }" />

    <SkeletonList v-if="loading" :rows="2" />
    <AppState v-else-if="loadError" variant="error" :title="loadError" retry @retry="load" />

    <template v-else-if="user">
      <AppSection>
        <div class="flex items-start gap-4">
          <MediaThumb :initial="initialOf(user.displayName)" :alt="user.displayName" size-class="size-16" rounded="full" />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <StatusBadge :label="USER_STATUS_LABELS[user.status]" :meta="USER_STATUS_META[user.status]" size="sm" />
              <UBadge color="neutral" variant="subtle" size="sm" class="rounded-full">{{ USER_ROLE_LABELS[user.role] || user.role }}</UBadge>
            </div>
            <dl class="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt class="text-xs text-muted">ایمیل</dt>
                <dd class="truncate font-medium text-highlighted"><span class="ltr">{{ user.email }}</span></dd>
              </div>
              <div>
                <dt class="text-xs text-muted">تلفن</dt>
                <dd class="font-medium text-highlighted"><span v-if="user.phone" class="ltr">{{ user.phone }}</span><span v-else class="text-dimmed">—</span></dd>
              </div>
              <div>
                <dt class="text-xs text-muted">نام و نام خانوادگی</dt>
                <dd class="font-medium text-highlighted">{{ [user.firstName, user.lastName].filter(Boolean).join(' ') || '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-muted">عضویت</dt>
                <dd class="font-medium text-highlighted">{{ formatDate(user.createdAt) }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </AppSection>

      <AppSection title="اقدام مدیریتی" description="هر اقدام با دلیل در دفتر ممیزی ثبت می‌شود." class="mt-6">
        <div class="flex flex-wrap gap-2">
          <UButton v-if="user.status !== 'SUSPENDED'" color="error" variant="soft" size="md" icon="i-lucide-ban" @click="confirm = 'suspend'">مسدود</UButton>
          <UButton v-if="user.status !== 'DEACTIVATED'" color="neutral" variant="outline" size="md" icon="i-lucide-circle-off" @click="confirm = 'deactivate'">غیرفعال</UButton>
          <UButton v-if="user.status !== 'ACTIVE'" size="md" icon="i-lucide-check" @click="confirm = 'activate'">فعال‌سازی</UButton>
        </div>
      </AppSection>

      <UModal
        :open="Boolean(confirm)"
        :title="confirm ? ACTIONS[confirm].title : ''"
        :description="confirm ? ACTIONS[confirm].description : ''"
        @update:open="(v: boolean) => { if (!v) confirm = null }"
      >
        <template #body>
          <UFormField label="دلیل" name="reason" required help="حداقل ۳ کاراکتر">
            <UTextarea v-model="reason" class="w-full" :rows="3" autofocus />
          </UFormField>
          <InlineMessage :message="error" class="mt-3" />
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton color="neutral" variant="ghost" size="md" @click="confirm = null">انصراف</UButton>
            <UButton v-if="confirm" :color="ACTIONS[confirm].color" :icon="ACTIONS[confirm].icon" size="md" :loading="pending" :disabled="reason.trim().length < 3" @click="act">
              {{ ACTIONS[confirm].label }}
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
