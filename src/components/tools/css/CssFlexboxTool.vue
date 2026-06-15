<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">flex-direction</label>
        <select
          v-model="flexDirection"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        >
          <option value="row">row</option>
          <option value="row-reverse">row-reverse</option>
          <option value="column">column</option>
          <option value="column-reverse">column-reverse</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">justify-content</label>
        <select
          v-model="justifyContent"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        >
          <option value="flex-start">flex-start</option>
          <option value="center">center</option>
          <option value="flex-end">flex-end</option>
          <option value="space-between">space-between</option>
          <option value="space-around">space-around</option>
          <option value="space-evenly">space-evenly</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">align-items</label>
        <select
          v-model="alignItems"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        >
          <option value="flex-start">flex-start</option>
          <option value="center">center</option>
          <option value="flex-end">flex-end</option>
          <option value="stretch">stretch</option>
          <option value="baseline">baseline</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">flex-wrap</label>
        <select
          v-model="flexWrap"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        >
          <option value="nowrap">nowrap</option>
          <option value="wrap">wrap</option>
          <option value="wrap-reverse">wrap-reverse</option>
        </select>
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
          v-for="(color, index) in boxColors"
          :key="index"
          class="flex items-center justify-center rounded-md text-white text-sm font-medium"
          :style="{ backgroundColor: color, width: '60px', minHeight: '60px' }"
        >
          {{ index + 1 }}
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

const flexDirection = ref('row');
const justifyContent = ref('flex-start');
const alignItems = ref('stretch');
const flexWrap = ref('nowrap');

const boxColors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];

const previewStyle = computed(() => ({
  display: 'flex',
  flexDirection: flexDirection.value,
  justifyContent: justifyContent.value,
  alignItems: alignItems.value,
  flexWrap: flexWrap.value,
  gap: '8px',
}));

const cssCode = computed(() => {
  return [
    'display: flex;',
    `flex-direction: ${flexDirection.value};`,
    `justify-content: ${justifyContent.value};`,
    `align-items: ${alignItems.value};`,
    `flex-wrap: ${flexWrap.value};`,
    'gap: 8px;',
  ].join('\n');
});
</script>
