<script setup lang="ts">
import type { Pet } from '~~/shared/types/pet'
import { PET_TYPE_LABELS } from '~~/shared/constants/pets'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const pets = ref<Pet[]>([])
const loading = ref(true)
const error = ref('')
const showArchived = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { pets: Pet[] } }>('/api/pets', {
      query: showArchived.value ? { archived: '1' } : {},
    })
    pets.value = res.data.pets
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری فهرست ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

watch(showArchived, load)
onMounted(load)

const visible = computed(() => {
  if (showArchived.value) return pets.value
  return pets.value.filter(p => !p.archivedAt)
})
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-12">
    <div class="flex items-end justify-between gap-4">
      <div>
        <p class="text-sm text-forest-700">خانواده شما</p>
        <h1 class="mt-1 text-2xl font-semibold">حیوانات خانگی</h1>
      </div>
      <UButton to="/pets/new" size="sm">افزودن</UButton>
    </div>

    <label class="mt-6 flex items-center gap-2 text-sm text-ink-600">
      <input v-model="showArchived" type="checkbox">
      نمایش بایگانی‌شده‌ها
    </label>

    <AppState v-if="loading" title="در حال بارگذاری…" />
    <AppState v-else-if="error" :title="error" />
    <AppState
      v-else-if="visible.length === 0"
      title="هنوز حیوانی ثبت نشده"
      description="پروندهٔ سلامت، واکسن و داروها از اینجا شروع می‌شود."
    >
      <UButton to="/pets/new">ثبت اولین حیوان</UButton>
    </AppState>

    <ul v-else class="mt-8 divide-y divide-ink-200 border-t border-ink-200">
      <li v-for="pet in visible" :key="pet.id">
        <NuxtLink :to="`/pets/${pet.id}`" class="flex items-center gap-4 py-4">
          <div class="h-16 w-16 shrink-0 overflow-hidden border border-ink-200 bg-canvas-deep">
            <img v-if="pet.photoUrl" :src="pet.photoUrl" alt="" class="h-full w-full object-cover">
            <span v-else class="flex h-full w-full items-center justify-center text-ink-400">
              <UIcon name="i-lucide-paw-print" class="size-6" />
            </span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-medium">
              {{ pet.name }}
              <span v-if="pet.archivedAt" class="mr-2 text-xs font-normal text-ink-500">بایگانی</span>
            </p>
            <p class="mt-1 text-sm text-ink-600">{{ PET_TYPE_LABELS[pet.type] }}<template v-if="pet.breed"> · {{ pet.breed }}</template></p>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
