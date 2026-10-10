<script setup lang="ts">
/**
 * Accessible 1–5 score picker (radio group semantics, keyboard friendly).
 */
const props = withDefaults(defineProps<{
  modelValue: number
  label: string
  min?: number
  max?: number
  disabled?: boolean
}>(), {
  min: 1,
  max: 5,
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const options = computed(() => Array.from({ length: props.max - props.min + 1 }, (_, i) => props.min + i))
const groupId = useId()

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  let next = props.modelValue
  // RTL: ArrowLeft increases, ArrowRight decreases
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = Math.min(props.max, props.modelValue + 1)
  else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.max(props.min, props.modelValue - 1)
  else return
  event.preventDefault()
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="flex items-center justify-between gap-3">
    <span :id="groupId" class="text-sm font-medium text-default">{{ label }}</span>
    <div
      role="radiogroup"
      :aria-labelledby="groupId"
      class="flex items-center gap-1"
      dir="ltr"
      @keydown="onKeydown"
    >
      <button
        v-for="n in options"
        :key="n"
        type="button"
        role="radio"
        :aria-checked="modelValue === n"
        :aria-label="`${formatNumber(n)} از ${formatNumber(max)}`"
        :tabindex="modelValue === n ? 0 : -1"
        :disabled="disabled"
        class="flex size-10 items-center justify-center rounded-md transition-colors disabled:opacity-50"
        :class="n <= modelValue ? 'text-terracotta-500' : 'text-ink-300 hover:text-ink-400'"
        @click="emit('update:modelValue', n)"
      >
        <UIcon name="i-lucide-star" class="size-6" :class="n <= modelValue && 'fill-current'" />
      </button>
    </div>
  </div>
</template>
