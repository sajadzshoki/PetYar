<script setup lang="ts">
import type { Pet } from '~~/shared/types/pet'
import { PET_GENDER_LABELS, PET_TYPE_LABELS } from '~~/shared/constants/pets'
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
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="حیوانات خانگی" eyebrow="خانواده شما" description="پرونده سلامت، واکسن و داروهای هر حیوان از اینجا مدیریت می‌شود.">
      <template #actions>
        <UButton to="/pets/new" size="md" icon="i-lucide-plus">افزودن</UButton>
      </template>
    </PageHeader>

    <div class="mb-4 flex items-center justify-between gap-3">
      <USwitch v-model="showArchived" label="نمایش بایگانی‌شده‌ها" size="md" />
    </div>

    <SkeletonList v-if="loading" :rows="3" />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />
    <AppState
      v-else-if="visible.length === 0"
      icon="i-lucide-paw-print"
      title="هنوز حیوانی ثبت نشده"
      description="برای رزرو خدمات باید دست‌کم یک حیوان ثبت کنید. پرونده سلامت، واکسن و داروها از اینجا شروع می‌شود."
    >
      <UButton to="/pets/new" icon="i-lucide-plus">ثبت اولین حیوان</UButton>
    </AppState>

    <ul v-else class="grid gap-3 sm:grid-cols-2">
      <li v-for="pet in visible" :key="pet.id">
        <NuxtLink
          :to="`/pets/${pet.id}`"
          class="pressable surface group flex items-center gap-3.5 p-3.5 transition-colors hover:border-forest-300"
        >
          <MediaThumb :src="pet.photoUrl" :icon="PET_TYPE_ICONS[pet.type]" size-class="size-16" rounded="xl" />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="truncate text-base font-bold text-highlighted">{{ pet.name }}</p>
              <UBadge v-if="pet.archivedAt" color="neutral" variant="subtle" size="sm" class="rounded-full">بایگانی</UBadge>
            </div>
            <p class="mt-0.5 truncate text-sm text-muted">
              {{ PET_TYPE_LABELS[pet.type] }}<template v-if="pet.breed"> · {{ pet.breed }}</template> · {{ PET_GENDER_LABELS[pet.gender] }}
            </p>
          </div>
          <UIcon name="i-lucide-chevron-left" class="size-5 shrink-0 text-ink-300 transition-colors group-hover:text-ink-500" aria-hidden="true" />
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
