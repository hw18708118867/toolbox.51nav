<template>
  <div class="w-full">
    <div v-if="label" class="flex items-center justify-between mb-1.5">
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">{{ label }}</label>
      <span v-if="showCount && modelValue" class="text-xs" style="color: var(--color-text-muted);">
        {{ modelValue.length }} 字符
      </span>
    </div>
    <textarea
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      :placeholder="placeholder"
      :rows="rows"
      class="tool-input w-full rounded-xl px-4 py-3 text-sm resize-y"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  label?: string;
  placeholder?: string;
  rows?: number;
  showCount?: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>
