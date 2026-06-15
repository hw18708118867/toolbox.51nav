<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-1.5">
      <label v-if="label" class="text-xs font-medium" style="color: var(--color-text-secondary);">{{ label }}</label>
      <CopyButton v-if="modelValue" :text="modelValue" />
    </div>
    <textarea
      :value="modelValue"
      readonly
      :rows="rows"
      class="tool-input w-full rounded-xl px-4 py-3 text-sm resize-y"
    />
  </div>
</template>

<script setup lang="ts">
import CopyButton from './CopyButton.vue';

defineProps<{
  modelValue: string;
  label?: string;
  rows?: number;
}>();
</script>
