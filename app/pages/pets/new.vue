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
  <div class="mx-auto max-w-lg px-4 py-12">
    <NuxtLink to="/pets" class="text-sm text-ink-600">بازگشت</NuxtLink>
    <h1 class="mt-3 text-2xl font-semibold">حیوان جدید</h1>
    <p class="mt-2 text-sm text-ink-600">پرونده فقط برای حساب شما ساخته می‌شود.</p>
    <div class="mt-8">
      <PetForm :pending="pending" :error="error" @submit="submit" />
    </div>
  </div>
</template>
