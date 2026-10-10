<script setup lang="ts">
import type { ProviderService, ServiceCategory } from '~~/shared/types/provider'
import { PRICING_TYPE_LABELS, PRICING_TYPES } from '~~/shared/constants/providers'

const props = defineProps<{
  service?: ProviderService | null
  categories: ServiceCategory[]
  pending?: boolean
  error?: string
}>()

const emit = defineEmits<{
  submit: [payload: Record<string, unknown>]
}>()

const form = reactive({
  categoryId: props.service?.categoryId || props.categories[0]?.id || '',
  title: props.service?.title || '',
  description: props.service?.description || '',
  pricingType: props.service?.pricingType || 'HOURLY',
  price: props.service?.price != null ? String(props.service.price) : '',
  durationMinutes: props.service?.durationMinutes != null ? String(props.service.durationMinutes) : '',
  capacity: props.service?.capacity != null ? String(props.service.capacity) : '1',
  isActive: props.service?.isActive ?? true,
})

watch(() => props.categories, (cats) => {
  if (!form.categoryId && cats[0]) form.categoryId = cats[0].id
})

const categoryItems = computed(() => props.categories.map(c => ({ label: c.name, value: c.id })))
const pricingItems = PRICING_TYPES.map(value => ({ label: PRICING_TYPE_LABELS[value], value }))

function submit() {
  emit('submit', {
    categoryId: form.categoryId,
    title: form.title,
    description: form.description,
    pricingType: form.pricingType,
    price: form.price === '' ? null : Number(form.price),
    durationMinutes: form.durationMinutes === '' ? null : Number(form.durationMinutes),
    capacity: Number(form.capacity),
    isActive: form.isActive,
  })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <UFormField label="دسته">
      <USelect v-model="form.categoryId" :items="categoryItems" class="w-full" />
    </UFormField>
    <UFormField label="عنوان">
      <UInput v-model="form.title" class="w-full" />
    </UFormField>
    <UFormField label="توضیح">
      <UTextarea v-model="form.description" class="w-full" :rows="4" />
    </UFormField>
    <UFormField label="نوع قیمت">
      <USelect v-model="form.pricingType" :items="pricingItems" class="w-full" />
    </UFormField>
    <UFormField label="قیمت (تومان)">
      <UInput v-model="form.price" type="number" min="0" class="w-full" dir="ltr" />
    </UFormField>
    <UFormField label="مدت (دقیقه)">
      <UInput v-model="form.durationMinutes" type="number" min="5" class="w-full" dir="ltr" />
    </UFormField>
    <UFormField label="ظرفیت">
      <UInput v-model="form.capacity" type="number" min="1" class="w-full" dir="ltr" />
    </UFormField>
    <UCheckbox v-model="form.isActive" label="خدمت فعال است" />
    <p v-if="error" class="text-sm text-terracotta-700">{{ error }}</p>
    <UButton type="submit" :loading="pending">ذخیره خدمت</UButton>
  </form>
</template>
