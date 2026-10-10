<script setup lang="ts">
import type { Pet } from '~~/shared/types/pet'
import { PET_GENDER_LABELS, PET_TYPE_LABELS, PET_GENDERS, PET_TYPES } from '~~/shared/constants/pets'

const props = defineProps<{
  pet?: Pet | null
  pending?: boolean
  error?: string
  submitLabel?: string
}>()

const emit = defineEmits<{
  submit: [payload: Record<string, unknown>]
}>()

const form = reactive({
  name: props.pet?.name || '',
  type: props.pet?.type || 'DOG',
  breed: props.pet?.breed || '',
  gender: props.pet?.gender || 'UNKNOWN',
  birthDate: props.pet?.birthDate || '',
  weightKg: props.pet?.weightKg != null ? String(props.pet.weightKg) : '',
  behaviorNotes: props.pet?.behaviorNotes || '',
  allergies: props.pet?.allergies || '',
  medicalNotes: props.pet?.medicalNotes || '',
  neutered: props.pet?.neutered || false,
})

watch(() => props.pet, (pet) => {
  if (!pet) return
  form.name = pet.name
  form.type = pet.type
  form.breed = pet.breed || ''
  form.gender = pet.gender
  form.birthDate = pet.birthDate || ''
  form.weightKg = pet.weightKg != null ? String(pet.weightKg) : ''
  form.behaviorNotes = pet.behaviorNotes || ''
  form.allergies = pet.allergies || ''
  form.medicalNotes = pet.medicalNotes || ''
  form.neutered = pet.neutered
})

const genderItems = PET_GENDERS.map(value => ({ label: PET_GENDER_LABELS[value], value }))
const nameMissing = computed(() => form.name.trim().length === 0)

function submit() {
  if (nameMissing.value) return
  emit('submit', {
    name: form.name,
    type: form.type,
    breed: form.breed,
    gender: form.gender,
    birthDate: form.birthDate || null,
    weightKg: form.weightKg === '' ? null : Number(form.weightKg),
    behaviorNotes: form.behaviorNotes,
    allergies: form.allergies,
    medicalNotes: form.medicalNotes,
    neutered: form.neutered,
  })
}
</script>

<template>
  <form class="space-y-6" novalidate @submit.prevent="submit">
    <AppSection title="مشخصات اصلی">
      <div class="space-y-5">
        <UFormField label="نوع حیوان" name="type" required>
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="نوع حیوان">
            <button
              v-for="value in PET_TYPES"
              :key="value"
              type="button"
              role="radio"
              :aria-checked="form.type === value"
              class="pressable flex min-h-[4.25rem] flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold transition-colors"
              :class="form.type === value ? 'border-primary bg-forest-50 text-primary' : 'border-default bg-paper text-toned hover:border-accented'"
              @click="form.type = value"
            >
              <UIcon :name="PET_TYPE_ICONS[value]" class="size-6" aria-hidden="true" />
              {{ PET_TYPE_LABELS[value] }}
            </button>
          </div>
        </UFormField>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="نام" name="name" required>
            <UInput v-model="form.name" class="w-full" placeholder="مثلاً: لوسی" autocomplete="off" />
          </UFormField>
          <UFormField label="نژاد" name="breed">
            <UInput v-model="form.breed" class="w-full" placeholder="اختیاری" />
          </UFormField>
          <UFormField label="جنسیت" name="gender">
            <USelect v-model="form.gender" :items="genderItems" class="w-full" />
          </UFormField>
          <UFormField label="تاریخ تولد" name="birthDate">
            <UInput v-model="form.birthDate" type="date" class="w-full" dir="ltr" />
          </UFormField>
          <UFormField label="وزن (کیلوگرم)" name="weightKg">
            <UInput v-model="form.weightKg" type="number" step="0.1" min="0" class="w-full" dir="ltr" inputmode="decimal" />
          </UFormField>
          <UFormField label="عقیم‌سازی" name="neutered" class="flex flex-col justify-end">
            <USwitch v-model="form.neutered" label="عقیم شده است" class="min-h-11" />
          </UFormField>
        </div>
      </div>
    </AppSection>

    <AppSection title="سلامت و رفتار" description="این یادداشت‌ها به ارائه‌دهنده کمک می‌کند بهتر مراقبت کند.">
      <div class="space-y-5">
        <UFormField label="آلرژی‌ها" name="allergies">
          <UTextarea v-model="form.allergies" class="w-full" :rows="2" placeholder="مثلاً: حساسیت به مرغ" />
        </UFormField>
        <UFormField label="یادداشت پزشکی" name="medicalNotes">
          <UTextarea v-model="form.medicalNotes" class="w-full" :rows="2" />
        </UFormField>
        <UFormField label="رفتار و خلق‌وخو" name="behaviorNotes">
          <UTextarea v-model="form.behaviorNotes" class="w-full" :rows="2" placeholder="مثلاً: با غریبه‌ها خجالتی است" />
        </UFormField>
      </div>
    </AppSection>

    <InlineMessage :message="error || ''" />
    <div class="flex justify-end">
      <UButton type="submit" :loading="pending" :disabled="nameMissing" icon="i-lucide-check">
        {{ submitLabel || 'ذخیره' }}
      </UButton>
    </div>
  </form>
</template>
