<script setup lang="ts">
import { VERIFICATION_STATUS_LABELS, type VerificationStatus } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

interface Row {
  id: string
  displayName: string
  email: string
  isActive: boolean
  verificationStatus: VerificationStatus
}

const route = useRoute()
const toast = useToast()
const provider = ref<Row | null>(null)
const reason = ref('')
const error = ref('')
const loadError = ref('')
const loading = ref(true)
const pending = ref(false)
const confirm = ref<'deactivate' | 'activate' | null>(null)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await $fetch<{ data: { provider: Row } }>(`/api/admin/providers/${route.params.id}`)
    provider.value = res.data.provider
  }
  catch (err) {
    loadError.value = apiErrorMessage(err, 'پرونده یافت نشد')
  }
  finally {
    loading.value = false
  }
}

async function act() {
  if (!provider.value || !confirm.value || reason.value.trim().length < 3) return
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { provider: Row } }>(`/api/admin/providers/${provider.value.id}/${confirm.value}`, { method: 'POST', body: { reason: reason.value } })
    provider.value = res.data.provider
    toast.add({ title: 'وضعیت پرونده به‌روز شد', icon: 'i-lucide-check', color: 'success' })
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

useHead(() => ({ title: `${provider.value?.displayName || 'ارائه‌دهنده'} | مدیریت پت‌یار` }))
</script>

<template>
  <div class="max-w-content">
    <PageHeader :title="provider?.displayName || 'ارائه‌دهنده'" compact :back="{ to: '/admin/providers', label: 'ارائه‌دهندگان' }">
      <template v-if="provider" #actions>
        <UButton :to="`/providers/${provider.id}`" color="neutral" variant="outline" size="md" icon="i-lucide-eye">صفحه عمومی</UButton>
      </template>
    </PageHeader>

    <SkeletonList v-if="loading" :rows="2" />
    <AppState v-else-if="loadError" variant="error" :title="loadError" retry @retry="load" />

    <template v-else-if="provider">
      <AppSection>
        <div class="flex flex-wrap items-center gap-2">
          <StatusBadge :label="VERIFICATION_STATUS_LABELS[provider.verificationStatus]" :meta="VERIFICATION_STATUS_META[provider.verificationStatus]" size="sm" />
          <UBadge :color="provider.isActive ? 'success' : 'neutral'" variant="subtle" size="sm" class="rounded-full" :icon="provider.isActive ? 'i-lucide-eye' : 'i-lucide-eye-off'">
            {{ provider.isActive ? 'قابل مشاهده' : 'پنهان از جستجو' }}
          </UBadge>
        </div>
        <dl class="mt-3 text-sm">
          <dt class="text-xs text-muted">ایمیل مالک</dt>
          <dd class="font-medium text-highlighted"><span class="ltr">{{ provider.email }}</span></dd>
        </dl>
      </AppSection>

      <AppSection title="اقدام مدیریتی" description="پنهان کردن، پرونده و خدمات را از جستجو حذف می‌کند؛ رزروهای فعال دست‌نخورده می‌مانند." class="mt-6">
        <div class="flex flex-wrap gap-2">
          <UButton v-if="provider.isActive" color="neutral" variant="outline" size="md" icon="i-lucide-eye-off" @click="confirm = 'deactivate'">پنهان کردن</UButton>
          <UButton v-else size="md" icon="i-lucide-eye" @click="confirm = 'activate'">نمایش عمومی</UButton>
        </div>
      </AppSection>

      <UModal
        :open="Boolean(confirm)"
        :title="confirm === 'deactivate' ? 'پنهان کردن پرونده' : 'نمایش عمومی پرونده'"
        description="دلیل در دفتر ممیزی ثبت می‌شود."
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
            <UButton size="md" :color="confirm === 'deactivate' ? 'error' : 'primary'" :loading="pending" :disabled="reason.trim().length < 3" @click="act">
              {{ confirm === 'deactivate' ? 'پنهان کردن' : 'نمایش عمومی' }}
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
