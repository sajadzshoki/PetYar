<script setup lang="ts">
import type { Payment } from '~~/shared/types/payment'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

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
    await navigateTo(`/payments/${res.data.payment.id}`)
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بازگشت از درگاه ناموفق بود')
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="mx-auto max-w-xl px-4 py-12">
    <AppState v-if="loading" title="در حال بررسی نتیجه پرداخت…" />
    <AppState v-else :title="error" />
  </div>
</template>
