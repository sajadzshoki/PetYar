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
  loadError.value = ''
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
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader
      :title="pet ? `ویرایش ${pet.name}` : 'ویرایش'"
      :back="{ to: `/pets/${id}`, label: 'بازگشت به پرونده' }"
      compact
    />
    <SkeletonList v-if="loading" :rows="2" :avatar="false" />
    <AppState v-else-if="loadError" variant="error" :title="loadError" retry @retry="load" />
    <PetForm v-else-if="pet" :pet="pet" :pending="pending" :error="error" submit-label="ذخیره تغییرات" @submit="submit" />
  </div>
</template>
