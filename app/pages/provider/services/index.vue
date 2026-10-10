<script setup lang="ts">
import type { ProviderService } from '~~/shared/types/provider'
import { PRICING_TYPE_LABELS } from '~~/shared/constants/providers'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: 'provider' })

const toast = useToast()
const services = ref<ProviderService[]>([])
const loading = ref(true)
const error = ref('')
const busyId = ref<string | null>(null)
const toDelete = ref<ProviderService | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { services: ProviderService[] } }>('/api/provider/services')
    services.value = res.data.services
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری خدمات ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

async function toggle(svc: ProviderService) {
  busyId.value = svc.id
  try {
    await $fetch(`/api/provider/services/${svc.id}`, {
      method: 'PATCH',
      body: {
        categoryId: svc.categoryId,
        title: svc.title,
        description: svc.description,
        pricingType: svc.pricingType,
        price: svc.price,
        durationMinutes: svc.durationMinutes,
        capacity: svc.capacity,
        isActive: !svc.isActive,
      },
    })
    await load()
  }
  catch (err) {
    toast.add({ title: apiErrorMessage(err, 'به‌روزرسانی ناموفق بود'), color: 'error', icon: 'i-lucide-circle-alert' })
  }
  finally {
    busyId.value = null
  }
}

async function remove() {
  if (!toDelete.value) return
  busyId.value = toDelete.value.id
  try {
    await $fetch(`/api/provider/services/${toDelete.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'خدمت حذف شد', icon: 'i-lucide-check', color: 'success' })
    toDelete.value = null
    await load()
  }
  catch (err) {
    toast.add({ title: apiErrorMessage(err, 'حذف ناموفق بود'), color: 'error', icon: 'i-lucide-circle-alert' })
  }
  finally {
    busyId.value = null
  }
}

function priceLine(svc: ProviderService) {
  if (svc.pricingType === 'CUSTOM' || svc.price == null) return PRICING_TYPE_LABELS[svc.pricingType]
  return `${formatToman(svc.price)} · ${PRICING_TYPE_LABELS[svc.pricingType]}`
}

onMounted(load)

useHead({ title: 'خدمات من | پت‌یار' })
</script>

<template>
  <div class="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-10">
    <PageHeader title="خدمات من" description="آنچه ارائه می‌دهید، با قیمت و مدت مشخص.">
      <template #actions>
        <UButton to="/provider/services/new" size="md" icon="i-lucide-plus">خدمت جدید</UButton>
      </template>
    </PageHeader>

    <SkeletonList v-if="loading" :rows="3" />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />
    <AppState v-else-if="!services.length" icon="i-lucide-briefcase" title="خدمتی ثبت نشده" description="عنوان، قیمت و دسته را اضافه کنید تا در جستجو دیده شوید.">
      <UButton to="/provider/services/new" icon="i-lucide-plus">افزودن خدمت</UButton>
    </AppState>

    <ul v-else class="grid gap-3">
      <li v-for="svc in services" :key="svc.id" class="surface p-4" :class="!svc.isActive && 'opacity-80'">
        <div class="flex items-start gap-3">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-primary" aria-hidden="true">
            <UIcon name="i-lucide-briefcase" class="size-5" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-primary">{{ svc.categoryName }}</p>
            <h3 class="mt-0.5 flex flex-wrap items-center gap-2 text-base font-bold text-highlighted">
              {{ svc.title }}
              <UBadge v-if="!svc.isActive" color="neutral" variant="subtle" size="sm" class="rounded-full">غیرفعال</UBadge>
            </h3>
            <p class="mt-1 text-sm text-toned">{{ priceLine(svc) }}</p>
            <p class="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
              <span v-if="svc.durationMinutes"><span class="num">{{ formatNumber(svc.durationMinutes) }}</span> دقیقه</span>
              <span>ظرفیت <span class="num">{{ formatNumber(svc.capacity) }}</span></span>
            </p>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2 border-t border-muted pt-3">
          <UButton :to="`/provider/services/${svc.id}`" size="sm" color="neutral" variant="outline" icon="i-lucide-pencil">ویرایش</UButton>
          <UButton size="sm" color="neutral" variant="ghost" :icon="svc.isActive ? 'i-lucide-eye-off' : 'i-lucide-eye'" :loading="busyId === svc.id" @click="toggle(svc)">
            {{ svc.isActive ? 'غیرفعال کردن' : 'فعال کردن' }}
          </UButton>
          <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-trash-2" class="ms-auto" aria-label="حذف خدمت" @click="toDelete = svc">حذف</UButton>
        </div>
      </li>
    </ul>

    <UModal :open="Boolean(toDelete)" title="حذف خدمت" description="این خدمت از پرونده شما حذف می‌شود و دیگر قابل رزرو نیست." @update:open="(v: boolean) => { if (!v) toDelete = null }">
      <template #body>
        <p v-if="toDelete" class="text-sm font-medium text-highlighted">{{ toDelete.title }}</p>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" size="md" @click="toDelete = null">انصراف</UButton>
          <UButton color="error" size="md" icon="i-lucide-trash-2" :loading="Boolean(toDelete && busyId === toDelete.id)" @click="remove">حذف</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
