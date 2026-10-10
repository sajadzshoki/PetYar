<script setup lang="ts">
import type { AuditLogEntry } from '~~/shared/types/moderation'
import { apiErrorMessage } from '~/utils/api-error'

definePageMeta({ middleware: ['auth', 'role'], roles: ['ADMIN'], layout: 'admin' })

const logs = ref<AuditLogEntry[]>([])
const error = ref('')
const loading = ref(true)
const expanded = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { logs: AuditLogEntry[] } }>('/api/admin/audit')
    logs.value = res.data.logs
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'بارگذاری ناموفق بود')
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

function hasMeta(item: AuditLogEntry) {
  return item.metadata && Object.keys(item.metadata).length > 0
}

useHead({ title: 'دفتر ممیزی | مدیریت پت‌یار' })
</script>

<template>
  <div class="max-w-content">
    <PageHeader title="دفتر ممیزی" description="تغییرات مدیریتی و امنیتی ثبت‌شده؛ فقط خواندنی." compact />

    <SkeletonList v-if="loading" :rows="6" />
    <AppState v-else-if="error" variant="error" :title="error" retry @retry="load" />
    <AppState v-else-if="!logs.length" icon="i-lucide-scroll-text" title="رویدادی ثبت نشده" compact />
    <ol v-else class="surface divide-y divide-muted">
      <li v-for="item in logs" :key="item.id" class="px-4 py-3 sm:px-5">
        <div class="flex items-start gap-3">
          <span class="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-canvas-deep text-muted" aria-hidden="true">
            <UIcon name="i-lucide-history" class="size-4" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm text-highlighted">
              <span class="font-semibold">{{ item.actorName }}</span>
              <span class="text-muted"> · </span>
              <code class="ltr rounded bg-canvas-deep px-1.5 py-0.5 font-mono text-xs text-default">{{ item.action }}</code>
              <span class="text-muted"> روی </span>
              <span class="font-medium">{{ item.entityType }}</span>
            </p>
            <p class="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-dimmed">
              <time :datetime="item.createdAt">{{ formatDateTime(item.createdAt) }}</time>
              <span v-if="item.entityId" class="ltr font-mono">{{ item.entityId }}</span>
            </p>
            <template v-if="hasMeta(item)">
              <button type="button" class="mt-1 text-xs font-medium text-primary hover:underline" :aria-expanded="expanded === item.id" @click="expanded = expanded === item.id ? null : item.id">
                {{ expanded === item.id ? 'بستن جزئیات' : 'جزئیات' }}
              </button>
              <pre v-if="expanded === item.id" class="ltr mt-2 max-h-64 overflow-auto rounded-lg bg-ink-950 p-3 text-start text-[11px] leading-5 text-ink-100">{{ JSON.stringify(item.metadata, null, 2) }}</pre>
            </template>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>
