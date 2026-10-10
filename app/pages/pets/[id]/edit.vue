<script setup lang="ts">
import type { Pet, PetDetail } from '~~/shared/types/pet'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const pet = ref<Pet | null>(null)
const loading = ref(true)
const pending = ref(false)
const error = ref('')
const loadError = ref('')

async function load() {
  loading.value = true
  try {
    const res = await $fetch<{ data: { pet: PetDetail } }>(`/api/pets/${id.value}`)
    pet.value = res.data.pet
  }
  catch (err) {
    loadError.value = apiErrorMessage(err, 'پرونده یافت نشد')
  }
  finally {
    loading.value = false
  }
}

async function submit(payload: Record<string, unknown>) {
  pending.value = true
  error.value = ''
  try {
    await $fetch(`/api/pets/${id.value}`, { method: 'PATCH', body: payload })
    await navigateTo(`/pets/${id.value}`)
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'ذخیره ناموفق بود')
  }
  finally {
    pending.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-12">
    <NuxtLink :to="`/pets/${id}`" class="text-sm text-ink-600">بازگشت به پرونده</NuxtLink>
    <h1 class="mt-3 text-2xl font-semibold">ویرایش</h1>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <AppState v-else-if="loadError" :title="loadError" />
    <div v-else-if="pet" class="mt-8">
      <PetForm :pet="pet" :pending="pending" :error="error" @submit="submit" />
    </div>
  </div>
</template>
