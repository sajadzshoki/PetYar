<script setup lang="ts">
import type { Pet } from '~~/shared/types/pet'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const pending = ref(false)
const error = ref('')

async function submit(payload: Record<string, unknown>) {
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { pet: Pet } }>('/api/pets', {
      method: 'POST',
      body: payload,
    })
    await navigateTo(`/pets/${res.data.pet.id}`)
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'ثبت حیوان ناموفق بود')
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader
      title="حیوان جدید"
      description="پرونده فقط برای حساب شما ساخته می‌شود و بعداً می‌توانید عکس، واکسن و دارو اضافه کنید."
      :back="{ to: '/pets', label: 'حیوانات من' }"
      compact
    />
    <PetForm :pending="pending" :error="error" submit-label="ثبت حیوان" @submit="submit" />
  </div>
</template>
