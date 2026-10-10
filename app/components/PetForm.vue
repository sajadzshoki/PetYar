<script setup lang="ts">
import type { Pet } from '~~/shared/types/pet'
import { PET_GENDER_LABELS, PET_TYPE_LABELS, PET_GENDERS, PET_TYPES } from '~~/shared/constants/pets'

const props = defineProps<{
  pet?: Pet | null
  pending?: boolean
  error?: string
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

const typeItems = PET_TYPES.map(value => ({ label: PET_TYPE_LABELS[value], value }))
const genderItems = PET_GENDERS.map(value => ({ label: PET_GENDER_LABELS[value], value }))

function submit() {
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
  <form class="space-y-4" @submit.prevent="submit">
    <UFormField label="نام" name="name">
      <UInput v-model="form.name" class="w-full" />
    </UFormField>
    <UFormField label="نوع" name="type">
      <USelect v-model="form.type" :items="typeItems" class="w-full" />
    </UFormField>
    <UFormField label="نژاد" name="breed">
      <UInput v-model="form.breed" class="w-full" />
    </UFormField>
    <UFormField label="جنسیت" name="gender">
      <USelect v-model="form.gender" :items="genderItems" class="w-full" />
    </UFormField>
    <UFormField label="تاریخ تولد" name="birthDate">
      <UInput v-model="form.birthDate" type="date" class="w-full" dir="ltr" />
    </UFormField>
    <UFormField label="وزن (کیلوگرم)" name="weightKg">
      <UInput v-model="form.weightKg" type="number" step="0.1" min="0" class="w-full" dir="ltr" />
    </UFormField>
    <UFormField label="عقیم‌سازی" name="neutered">
      <UCheckbox v-model="form.neutered" label="عقیم شده است" />
    </UFormField>
    <UFormField label="آلرژی‌ها" name="allergies">
      <UTextarea v-model="form.allergies" class="w-full" :rows="3" />
    </UFormField>
    <UFormField label="یادداشت پزشکی" name="medicalNotes">
      <UTextarea v-model="form.medicalNotes" class="w-full" :rows="3" />
    </UFormField>
    <UFormField label="رفتار و خلق‌وخو" name="behaviorNotes">
      <UTextarea v-model="form.behaviorNotes" class="w-full" :rows="3" />
    </UFormField>
    <p v-if="error" class="text-sm text-terracotta-700">{{ error }}</p>
    <UButton type="submit" :loading="pending">ذخیره</UButton>
  </form>
</template>
