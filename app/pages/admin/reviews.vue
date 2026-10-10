<script setup lang="ts">
import type { AdminReview } from '~~/shared/types/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const reviews = ref<AdminReview[]>([])
const reason = ref('')
const error = ref('')
const pending = ref('')

async function load() {
  const res = await $fetch<{ data: { reviews: AdminReview[] } }>('/api/admin/reviews')
  reviews.value = res.data.reviews
}

async function hide(id: string) {
  if (reason.value.trim().length < 3) return
  pending.value = id
  try {
    await $fetch(`/api/admin/reviews/${id}/hide`, { method: 'POST', body: { reason: reason.value } })
    await load()
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'خطا')
  }
  finally {
    pending.value = ''
  }
}

async function restore(id: string) {
  pending.value = id
  try {
    await $fetch(`/api/admin/reviews/${id}/restore`, { method: 'POST' })
    await load()
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'خطا')
  }
  finally {
    pending.value = ''
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-semibold">نظارت بر نظرها</h1>
    <UTextarea v-model="reason" class="mt-4 w-full" placeholder="دلیل پنهان‌سازی" />
    <p v-if="error" class="mt-2 text-sm text-terracotta-700">{{ error }}</p>
    <ul class="mt-6 divide-y divide-ink-100">
      <li v-for="item in reviews" :key="item.id" class="py-4 text-sm">
        <p class="font-medium">{{ item.ownerName }} · {{ item.overall }} از ۵ {{ item.hidden ? '· پنهان' : '' }}</p>
        <p class="mt-2 leading-7 text-ink-700">{{ item.comment }}</p>
        <div class="mt-2 flex gap-3">
          <button v-if="!item.hidden" type="button" class="text-terracotta-700" :disabled="pending === item.id" @click="hide(item.id)">پنهان</button>
          <button v-else type="button" class="text-forest-700" :disabled="pending === item.id" @click="restore(item.id)">نمایش مجدد</button>
        </div>
      </li>
    </ul>
  </div>
</template>
