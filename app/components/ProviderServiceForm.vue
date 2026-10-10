<script setup lang="ts">
import type { ProviderService, ServiceCategory } from '~~/shared/types/provider'
import { PRICING_TYPE_LABELS, PRICING_TYPES } from '~~/shared/constants/providers'

const props = withDefaults(defineProps<{
  service?: ProviderService | null
  categories: ServiceCategory[]
  pending?: boolean
  error?: string
  submitLabel?: string
}>(), {
  service: null,
  pending: false,
  error: '',
  submitLabel: 'ذخیره خدمت',
})

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

const categoryItems = computed(() => props.categories.map(c => ({ label: c.name, value: c.id, icon: categoryIcon(c.slug) })))
const pricingItems = PRICING_TYPES.map(value => ({ label: PRICING_TYPE_LABELS[value], value }))

const PRICE_UNIT: Record<string, string> = {
  HOURLY: 'تومان به ازای هر ساعت',
  DAILY: 'تومان به ازای هر روز',
  FIXED: 'تومان (مبلغ ثابت)',
  PER_VISIT: 'تومان به ازای هر مراجعه',
  CUSTOM: 'قیمت پس از گفتگو تعیین می‌شود',
}

const isCustom = computed(() => form.pricingType === 'CUSTOM')
const pricePreview = computed(() => (form.price && !isCustom.value ? formatToman(Number(form.price)) : ''))
const canSubmit = computed(() => form.title.trim().length >= 2 && Boolean(form.categoryId))

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
  <form class="space-y-5" @submit.prevent="submit">
    <AppSection title="معرفی خدمت">
      <div class="space-y-4">
        <UFormField label="دسته" name="categoryId" required>
          <USelect v-model="form.categoryId" :items="categoryItems" class="w-full" placeholder="انتخاب دسته" />
        </UFormField>
        <UFormField label="عنوان" name="title" required help="کوتاه و مشخص؛ مثلاً «پیاده‌روی روزانه سگ‌های بزرگ»">
          <UInput v-model="form.title" class="w-full" maxlength="120" />
        </UFormField>
        <UFormField label="توضیح" name="description" help="چه چیزی شامل می‌شود، چه چیزی نمی‌شود، چه محدودیت‌هایی دارد.">
          <UTextarea v-model="form.description" class="w-full" :rows="4" />
        </UFormField>
      </div>
    </AppSection>

    <AppSection title="قیمت و زمان">
      <div class="space-y-4">
        <UFormField label="نوع قیمت" name="pricingType">
          <USelect v-model="form.pricingType" :items="pricingItems" class="w-full" />
        </UFormField>
        <UFormField v-if="!isCustom" label="قیمت" name="price" :help="pricePreview ? `${pricePreview} · ${PRICE_UNIT[form.pricingType]}` : PRICE_UNIT[form.pricingType]">
          <UInput v-model="form.price" type="number" min="0" step="1000" inputmode="numeric" class="w-full ltr" />
        </UFormField>
        <p v-else class="rounded-lg bg-canvas-deep p-3 text-sm text-toned">{{ PRICE_UNIT.CUSTOM }}؛ مبلغ در صفحه رزرو «توافقی» نمایش داده می‌شود.</p>
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="مدت (دقیقه)" name="durationMinutes" help="اختیاری">
            <UInput v-model="form.durationMinutes" type="number" min="5" step="5" inputmode="numeric" class="w-full ltr" />
          </UFormField>
          <UFormField label="ظرفیت" name="capacity" help="هم‌زمان چند حیوان">
            <UInput v-model="form.capacity" type="number" min="1" inputmode="numeric" class="w-full ltr" />
          </UFormField>
        </div>
      </div>
    </AppSection>

    <AppSection>
      <USwitch v-model="form.isActive" label="خدمت فعال است" description="خدمات غیرفعال در جستجو نمایش داده نمی‌شوند." />
    </AppSection>

    <InlineMessage :message="error" />
    <UButton type="submit" block :loading="pending" :disabled="!canSubmit" icon="i-lucide-check">{{ submitLabel }}</UButton>
  </form>
</template>
