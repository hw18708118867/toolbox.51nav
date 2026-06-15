<template>
  <div class="space-y-4">
    <div class="grid grid-cols-3 gap-4">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">grid-template-columns</label>
        <input
          v-model="gridTemplateColumns"
          type="text"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none "
          
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">grid-template-rows</label>
        <input
          v-model="gridTemplateRows"
          type="text"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none "
          
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">gap</label>
        <input
          v-model="gap"
          type="text"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none "
          
        />
      </div>
    </div>

    <div>
      <label class="text-xs font-medium block mb-2" style="color: var(--color-text-secondary);">预览</label>
      <div
        class="rounded-lg border p-4 min-h-[200px]"
        :style="previewStyle"
        style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
      >
        <div
          v-for="index in 6"
          :key="index"
          class="flex items-center justify-center rounded-md text-white text-sm font-medium min-h-[60px]"
          :style="{ backgroundColor: boxColors[(index - 1) % boxColors.length] }"
        >
          {{ index }}
        </div>
      </div>
    </div>

    <div>
      <div class="flex items-center justify-between mb-1.5">
        <label class="text-xs font-medium" style="color: var(--color-text-secondary);">CSS 代码</label>
        <CopyButton :text="cssCode" />
      </div>
      <pre
        class="w-full rounded-md border px-3 py-2 text-sm font-mono overflow-x-auto"
        style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text);"
      >{{ cssCode }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const gridTemplateColumns = ref('1fr 1fr 1fr');
const gridTemplateRows = ref('auto');
const gap = ref('10px');

const boxColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#F0B27A'];

const previewStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: gridTemplateColumns.value,
  gridTemplateRows: gridTemplateRows.value,
  gap: gap.value,
}));

const cssCode = computed(() => {
  return [
    'display: grid;',
    `grid-template-columns: ${gridTemplateColumns.value};`,
    `grid-template-rows: ${gridTemplateRows.value};`,
    `gap: ${gap.value};`,
  ].join('\n');
});
</script>
