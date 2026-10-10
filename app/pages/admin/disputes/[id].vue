<script setup lang="ts">
import type { BookingDispute } from '~~/shared/types/moderation'
import { DISPUTE_RESOLUTION_LABELS, DISPUTE_RESOLUTIONS, DISPUTE_STATUS_LABELS } from '~~/shared/constants/moderation'
import { BOOKING_STATUS_LABELS, type BookingStatus } from '~~/shared/constants/bookings'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const route = useRoute()
const toast = useToast()
const dispute = ref<BookingDispute | null>(null)
const note = ref('')
const resolution = ref<(typeof DISPUTE_RESOLUTIONS)[number]>('UPHOLD')
const error = ref('')
const loadError = ref('')
const loading = ref(true)
const pending = ref(false)

const resolutionItems = DISPUTE_RESOLUTIONS.map(value => ({ label: DISPUTE_RESOLUTION_LABELS[value], value }))

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await $fetch<{ data: { dispute: BookingDispute } }>(`/api/admin/disputes/${route.params.id}`)
    dispute.value = res.data.dispute
  }
  catch (err) {
    loadError.value = apiErrorMessage(err, 'اختلاف یافت نشد')
  }
  finally {
    loading.value = false
  }
}

async function resolve() {
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { dispute: BookingDispute } }>(`/api/admin/disputes/${route.params.id}/resolve`, {
      method: 'POST',
      body: { resolution: resolution.value, note: note.value },
    })
    dispute.value = res.data.dispute
    toast.add({ title: 'تصمیم ثبت شد', icon: 'i-lucide-check', color: 'success' })
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'انجام نشد')
  }
  finally {
    pending.value = false
  }
}

const open = computed(() => dispute.value?.status === 'OPEN' || dispute.value?.status === 'IN_REVIEW')
const previousStatusLabel = computed(() => {
  const s = dispute.value?.previousStatus as BookingStatus | undefined
  return (s && BOOKING_STATUS_LABELS[s]) || dispute.value?.previousStatus || '—'
})

onMounted(load)

useHead({ title: 'اختلاف | مدیریت پت‌یار' })
</script>

<template>
  <div class="max-w-content">
    <PageHeader title="اختلاف رزرو" compact :back="{ to: '/admin/disputes', label: 'اختلاف‌ها' }">
      <template v-if="dispute" #meta>
        <div class="mt-3">
          <StatusBadge :label="DISPUTE_STATUS_LABELS[dispute.status]" :meta="DISPUTE_STATUS_META[dispute.status]" />
        </div>
      </template>
      <template v-if="dispute" #actions>
        <UButton :to="`/admin/bookings/${dispute.bookingId}`" color="neutral" variant="outline" size="md" icon="i-lucide-calendar">رزرو</UButton>
      </template>
    </PageHeader>

    <SkeletonList v-if="loading" :rows="2" />
    <AppState v-else-if="loadError" variant="error" :title="loadError" retry @retry="load" />

    <template v-else-if="dispute">
      <AppSection title="شرح اختلاف">
        <dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-xs text-muted">بازکننده</dt>
            <dd class="font-medium text-highlighted">{{ dispute.openerName }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted">زمان</dt>
            <dd class="font-medium text-highlighted">{{ formatDateTime(dispute.createdAt) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted">وضعیت قبلی رزرو</dt>
            <dd class="font-medium text-highlighted">{{ previousStatusLabel }}</dd>
          </div>
        </dl>
        <p class="mt-4 rounded-lg bg-canvas-deep p-3 text-sm leading-7 text-default">{{ dispute.reason }}</p>
      </AppSection>

      <AppSection v-if="open" title="تصمیم" description="بازپرداخت خودکار انجام نمی‌شود؛ فقط پیشنهاد ثبت می‌شود." class="mt-6">
        <div class="space-y-4">
          <UFormField label="تصمیم" name="resolution">
            <USelect v-model="resolution" :items="resolutionItems" class="w-full" />
          </UFormField>
          <UFormField label="یادداشت" name="note">
            <UTextarea v-model="note" class="w-full" :rows="3" />
          </UFormField>
        </div>
        <InlineMessage :message="error" class="mt-3" />
        <UButton class="mt-4" icon="i-lucide-gavel" :loading="pending" @click="resolve">ثبت تصمیم</UButton>
      </AppSection>

      <AppSection v-else title="نتیجه" class="mt-6">
        <p class="text-sm font-semibold text-highlighted">{{ dispute.resolution ? DISPUTE_RESOLUTION_LABELS[dispute.resolution] : '—' }}</p>
        <p v-if="dispute.adminNote" class="mt-2 text-sm leading-7 text-default">{{ dispute.adminNote }}</p>
        <p v-if="dispute.resolvedAt" class="mt-1 text-xs text-dimmed">{{ formatDateTime(dispute.resolvedAt) }}</p>
      </AppSection>
    </template>
  </div>
</template>
