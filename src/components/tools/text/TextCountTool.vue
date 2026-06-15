<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要统计的文本" :rows="8" />

    <div v-if="input" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div v-for="stat in stats" :key="stat.label" class="rounded-md border p-3 text-center" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
        <div class="text-xl font-bold" style="color: var(--color-primary);">{{ stat.value }}</div>
        <div class="text-xs mt-1" style="color: var(--color-text-muted);">{{ stat.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TextInput from '../../common/TextInput.vue';

const input = ref('');

const stats = computed(() => {
  const text = input.value;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  return [
    { label: '字符数', value: Array.from(text).length },
    { label: '字节数', value: bytes.length },
    { label: '行数', value: text ? text.split('\n').length : 0 },
    { label: '单词数', value: text.trim() ? text.trim().split(/\s+/).length : 0 },
    { label: '中文字符', value: (text.match(/[一-鿿]/g) || []).length },
    { label: '英文字母', value: (text.match(/[a-zA-Z]/g) || []).length },
    { label: '数字', value: (text.match(/\d/g) || []).length },
    { label: '空格', value: (text.match(/\s/g) || []).length },
  ];
});
</script>
