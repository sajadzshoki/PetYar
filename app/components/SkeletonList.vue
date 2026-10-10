<script setup lang="ts">
/**
 * Lightweight skeleton for list-style screens while the first request is in flight.
 */
withDefaults(defineProps<{
  rows?: number
  avatar?: boolean
}>(), {
  rows: 3,
  avatar: true,
})
</script>

<template>
  <div class="space-y-3" role="status" aria-busy="true" aria-label="در حال بارگذاری">
    <div v-for="n in rows" :key="n" class="surface flex items-center gap-3 p-4">
      <div v-if="avatar" class="skeleton size-14 shrink-0 rounded-xl" />
      <div class="flex-1 space-y-2.5">
        <div class="skeleton h-4 w-2/3" />
        <div class="skeleton h-3 w-1/2" />
      </div>
    </div>
  </div>
</template>
