<script setup lang="ts">
import type { Payment } from '~~/shared/types/payment'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', bottomNav: false })

const route = useRoute()
const error = ref('')
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await $fetch<{ data: { payment: Payment } }>('/api/payments/callback', {
      query: {
        paymentId: route.query.paymentId,
        Authority: route.query.Authority,
        Status: route.query.Status,
        authority: route.query.authority,
        status: route.query.status,
      },
    })
    await navigateTo(`/payments/${res.data.payment.id}`, { replace: true })
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بازگشت از درگاه ناموفق بود')
  }
  finally {
    loading.value = false
  }
})

useHead({ title: 'بررسی پرداخت | پت‌یار' })
</script>

<template>
  <div class="mx-auto flex min-h-[60dvh] max-w-narrow items-center px-4 py-10">
    <AppState v-if="loading" variant="loading" title="در حال بررسی نتیجه پرداخت…" description="لطفاً این صفحه را نبندید." class="w-full" />
    <AppState v-else variant="error" title="نتیجه پرداخت تأیید نشد" :description="error" class="w-full">
      <UButton to="/bookings" color="neutral" variant="outline" size="md">رزروهای من</UButton>
    </AppState>
  </div>
</template>
