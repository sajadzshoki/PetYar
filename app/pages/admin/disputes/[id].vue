<script setup lang="ts">
import type { BookingDispute } from '~~/shared/types/moderation'
import { DISPUTE_RESOLUTION_LABELS, DISPUTE_RESOLUTIONS, DISPUTE_STATUS_LABELS } from '~~/shared/constants/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const route = useRoute()
const dispute = ref<BookingDispute | null>(null)
const note = ref('')
const resolution = ref<(typeof DISPUTE_RESOLUTIONS)[number]>('UPHOLD')
const error = ref('')
const pending = ref(false)

async function load() {
  const res = await $fetch<{ data: { dispute: BookingDispute } }>(`/api/admin/disputes/${route.params.id}`)
  dispute.value = res.data.dispute
}

async function resolve() {
  pending.value = true
  try {
    const res = await $fetch<{ data: { dispute: BookingDispute } }>(`/api/admin/disputes/${route.params.id}/resolve`, {
      method: 'POST',
      body: { resolution: resolution.value, note: note.value },
    })
    dispute.value = res.data.dispute
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
    <NuxtLink to="/admin/disputes" class="text-sm text-ink-600">اختلاف‌ها</NuxtLink>
    <template v-if="dispute">
      <h1 class="mt-3 text-2xl font-semibold">{{ DISPUTE_STATUS_LABELS[dispute.status] }}</h1>
      <p class="mt-2 text-sm">بازکننده: {{ dispute.openerName }}</p>
      <p class="mt-2 text-sm leading-7">{{ dispute.reason }}</p>
      <p class="mt-2 text-sm">وضعیت قبلی رزرو: {{ dispute.previousStatus }}</p>
      <p class="mt-2 text-sm">
        <NuxtLink :to="`/admin/bookings/${dispute.bookingId}`" class="text-terracotta-700">رزرو</NuxtLink>
      </p>
      <template v-if="dispute.status === 'OPEN' || dispute.status === 'IN_REVIEW'">
        <UFormField class="mt-6" label="تصمیم">
          <select v-model="resolution" class="w-full border border-ink-200 bg-paper px-3 py-2 text-sm">
            <option v-for="r in DISPUTE_RESOLUTIONS" :key="r" :value="r">{{ DISPUTE_RESOLUTION_LABELS[r] }}</option>
          </select>
        </UFormField>
        <UTextarea v-model="note" class="mt-3 w-full" placeholder="یادداشت" />
        <p class="mt-2 text-xs text-ink-500">بازپرداخت خودکار انجام نمی‌شود؛ فقط پیشنهاد ثبت می‌شود.</p>
        <p v-if="error" class="mt-2 text-sm text-terracotta-700">{{ error }}</p>
        <UButton class="mt-4" :loading="pending" @click="resolve">ثبت تصمیم</UButton>
      </template>
      <p v-else-if="dispute.resolution" class="mt-6 text-sm">{{ DISPUTE_RESOLUTION_LABELS[dispute.resolution] }}</p>
    </template>
  </div>
</template>
