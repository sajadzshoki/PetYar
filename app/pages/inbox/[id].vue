<script setup lang="ts">
import type { ConversationDetail, Message } from '~~/shared/types/messaging'
import { apiErrorMessage } from '~/utils/api-error'

// Full-height chat: the bottom tab bar is hidden so the composer sits on the safe-area edge.
definePageMeta({ middleware: 'auth', bottomNav: false })

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
const preview = ref<string | null>(null)

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

function onComposerKeydown(event: KeyboardEvent) {
  // Enter sends on desktop keyboards; Shift+Enter inserts a newline.
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    send()
  }
}

/** Group messages by Tehran calendar day for date separators. */
const grouped = computed(() => {
  const out: { day: string, label: string, messages: Message[] }[] = []
  for (const msg of conversation.value?.messages || []) {
    const day = formatDate(msg.createdAt)
    const last = out[out.length - 1]
    if (last && last.day === day) last.messages.push(msg)
    else out.push({ day, label: day, messages: [msg] })
  }
  return out
})

const previewOpen = computed({
  get: () => Boolean(preview.value),
  set: (v: boolean) => {
    if (!v) preview.value = null
  },
})

useHead(() => ({ title: `${conversation.value?.title || 'گفتگو'} | پت‌یار` }))
</script>

<template>
  <div class="mx-auto flex h-[calc(100dvh-var(--spacing-header))] max-w-content flex-col lg:h-[calc(100dvh-var(--spacing-header-lg))]">
    <!-- Conversation header -->
    <header class="flex min-h-14 items-center gap-2 border-b border-default bg-paper px-2 sm:px-4">
      <UButton to="/inbox" color="neutral" variant="ghost" icon="i-lucide-arrow-right" square aria-label="همه گفتگوها" size="md" />
      <MediaThumb v-if="conversation" :initial="initialOf(conversation.title)" :alt="conversation.title" size-class="size-9" rounded="full" />
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-base">{{ conversation?.title || 'گفتگو' }}</h1>
        <NuxtLink v-if="conversation?.bookingId" :to="`/bookings/${conversation.bookingId}`" class="text-xs font-medium text-primary hover:underline">
          مشاهده رزرو مرتبط
        </NuxtLink>
      </div>
    </header>

    <div v-if="loading" class="flex-1 px-4 py-6"><SkeletonList :rows="4" avatar /></div>
    <AppState v-else-if="error" variant="error" :title="error" retry class="flex-1" @retry="load" />

    <template v-else-if="conversation">
      <div ref="scroller" class="min-h-0 flex-1 overflow-y-auto bg-canvas px-3 py-4 sm:px-4" role="log" aria-live="polite" aria-label="پیام‌ها">
        <AppState v-if="!conversation.messages.length" icon="i-lucide-message-circle" title="هنوز پیامی نیست" description="سلام کنید و سوال‌تان را بپرسید." compact />
        <template v-for="group in grouped" :key="group.day">
          <p class="my-3 text-center text-[11px] font-medium text-dimmed">
            <span class="rounded-full bg-canvas-deep px-2.5 py-1">{{ group.label }}</span>
          </p>
          <div
            v-for="msg in group.messages"
            :key="msg.id"
            class="mb-2 flex"
            :class="msg.senderId === myId ? 'justify-start' : 'justify-end'"
          >
            <div
              class="max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-7 shadow-card sm:max-w-[70%]"
              :class="msg.senderId === myId
                ? 'rounded-br-md bg-forest-600 text-white'
                : 'rounded-bl-md bg-paper text-default ring-1 ring-default'"
            >
              <button
                v-if="msg.attachmentUrl"
                type="button"
                class="mb-1.5 block overflow-hidden rounded-lg"
                aria-label="نمایش تصویر"
                @click="preview = msg.attachmentUrl"
              >
                <img :src="msg.attachmentUrl" alt="" class="max-h-56 w-auto" loading="lazy">
              </button>
              <p v-if="msg.body" class="whitespace-pre-wrap break-words">{{ msg.body }}</p>
              <p class="mt-0.5 text-[11px]" :class="msg.senderId === myId ? 'text-forest-100/90' : 'text-dimmed'">
                <span v-if="msg.senderId !== myId">{{ msg.senderName }} · </span><span class="num">{{ formatTime(msg.createdAt) }}</span>
              </p>
            </div>
          </div>
        </template>
      </div>

      <form class="border-t border-default bg-paper px-2 pt-2 pb-safe sm:px-4" @submit.prevent="send">
        <InlineMessage :message="sendError" class="mb-2" />
        <div class="flex items-end gap-1.5 pb-2">
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            icon="i-lucide-image-plus"
            square
            size="lg"
            aria-label="ارسال تصویر"
            :disabled="pending"
            @click="fileInput?.click()"
          />
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onFile">
          <UTextarea
            v-model="body"
            autoresize
            :rows="1"
            :maxrows="5"
            class="flex-1"
            placeholder="پیام…"
            aria-label="متن پیام"
            @keydown="onComposerKeydown"
          />
          <UButton type="submit" icon="i-lucide-send-horizontal" square size="lg" :loading="pending" :disabled="!body.trim()" aria-label="ارسال" :ui="{ leadingIcon: 'rotate-180' }" />
        </div>
      </form>
    </template>

    <UModal v-model:open="previewOpen" title="تصویر" :ui="{ content: 'sm:max-w-2xl bg-ink-950' }">
      <template #content>
        <div class="relative">
          <img v-if="preview" :src="preview" alt="" class="max-h-[85dvh] w-full object-contain">
          <UButton color="neutral" variant="solid" icon="i-lucide-x" size="md" square class="absolute end-3 top-3" aria-label="بستن" @click="preview = null" />
        </div>
      </template>
    </UModal>
  </div>
</template>
