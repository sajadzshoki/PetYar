<script setup lang="ts">
import type { ConversationDetail, Message } from '~~/shared/types/messaging'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: 'auth' })

const { user } = useUserSession()
const myId = computed(() => (user.value as { id?: string } | null)?.id)

const route = useRoute()
const id = computed(() => String(route.params.id))
const conversation = ref<ConversationDetail | null>(null)
const loading = ref(true)
const error = ref('')
const sendError = ref('')
const pending = ref(false)
const body = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const scroller = ref<HTMLElement | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { conversation: ConversationDetail } }>(`/api/conversations/${id.value}`)
    conversation.value = res.data.conversation
    await $fetch(`/api/conversations/${id.value}/read`, { method: 'POST' })
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'گفتگو در دسترس نیست')
    conversation.value = null
  }
  finally {
    loading.value = false
  }
}

watch(id, load, { immediate: true })

watch(() => conversation.value?.messages.length, async () => {
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
})

function pushMessage(message: Message) {
  if (!conversation.value) return
  conversation.value.messages = [...conversation.value.messages, message]
}

async function send() {
  if (!body.value.trim() || pending.value) return
  pending.value = true
  sendError.value = ''
  const text = body.value
  try {
    const res = await $fetch<{ data: { message: Message } }>(`/api/conversations/${id.value}/messages`, {
      method: 'POST',
      body: { body: text },
    })
    body.value = ''
    pushMessage(res.data.message)
  }
  catch (err) {
    body.value = text
    sendError.value = apiErrorMessage(err, 'ارسال نشد. دوباره تلاش کنید.')
  }
  finally {
    pending.value = false
  }
}

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  pending.value = true
  sendError.value = ''
  try {
    const form = new FormData()
    form.append('file', file)
    if (body.value.trim()) form.append('body', body.value.trim())
    const res = await $fetch<{ data: { message: Message } }>(`/api/conversations/${id.value}/attachments`, {
      method: 'POST',
      body: form,
    })
    body.value = ''
    pushMessage(res.data.message)
  }
  catch (err) {
    sendError.value = apiErrorMessage(err, 'ارسال تصویر ناموفق بود')
  }
  finally {
    pending.value = false
  }
}

function when(iso: string) {
  return new Date(iso).toLocaleTimeString('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="mx-auto flex h-[calc(100dvh-4rem)] max-w-lg flex-col px-4">
    <div class="py-4">
      <NuxtLink to="/inbox" class="text-sm text-ink-600">همه گفتگوها</NuxtLink>
      <h1 class="mt-2 text-xl font-semibold">{{ conversation?.title || 'گفتگو' }}</h1>
      <p v-if="conversation?.bookingId" class="mt-1 text-sm">
        <NuxtLink :to="`/bookings/${conversation.bookingId}`" class="text-terracotta-700">رزرو مرتبط</NuxtLink>
      </p>
    </div>
    <AppState v-if="loading" title="در حال بارگذاری…" />
    <AppState v-else-if="error" :title="error" />
    <template v-else-if="conversation">
      <div ref="scroller" class="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4">
        <p v-if="!conversation.messages.length" class="pt-8 text-center text-sm text-ink-500">هنوز پیامی نیست. سلام کنید.</p>
        <div
          v-for="msg in conversation.messages"
          :key="msg.id"
          class="max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-7"
          :class="msg.senderId === myId ? 'mr-auto bg-terracotta-500 text-white' : 'ml-auto bg-paper text-ink-800 ring-1 ring-ink-100'"
        >
          <p class="text-[11px] opacity-80">{{ msg.senderName }} · {{ when(msg.createdAt) }}</p>
          <p v-if="msg.body" class="mt-1 whitespace-pre-wrap">{{ msg.body }}</p>
          <img v-if="msg.attachmentUrl" :src="msg.attachmentUrl" alt="" class="mt-2 max-h-48 rounded-md">
        </div>
      </div>
      <form class="border-t border-ink-100 bg-canvas py-3" @submit.prevent="send">
        <p v-if="sendError" class="mb-2 text-sm text-terracotta-700">{{ sendError }}</p>
        <div class="flex items-end gap-2">
          <button type="button" class="mb-1 text-ink-500" @click="fileInput?.click()">تصویر</button>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onFile">
          <UTextarea v-model="body" autoresize class="flex-1" placeholder="پیام…" />
          <UButton type="submit" :loading="pending" :disabled="!body.trim()">ارسال</UButton>
        </div>
      </form>
    </template>
  </div>
</template>
