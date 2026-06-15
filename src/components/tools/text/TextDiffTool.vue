<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TextInput v-model="textA" label="文本 A" placeholder="请输入第一段文本" :rows="10" />
      <TextInput v-model="textB" label="文本 B" placeholder="请输入第二段文本" :rows="10" />
    </div>
    <div class="flex justify-end">
      <button @click="compare" class="btn-primary">
        对比
      </button>
    </div>
    <div v-if="diffResult" class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-medium" style="color: var(--color-text);">对比结果</h3>
        <span class="text-xs" style="color: var(--color-text-muted);">{{ diffStats }}</span>
      </div>
      <pre class="tool-input text-xs overflow-auto whitespace-pre-wrap" style="color: var(--color-text);" v-html="diffResult"></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';

const textA = ref('');
const textB = ref('');
const diffResult = ref('');
const diffStats = ref('');

function compare() {
  const linesA = textA.value.split('\n');
  const linesB = textB.value.split('\n');
  const maxLen = Math.max(linesA.length, linesB.length);
  let added = 0, removed = 0;
  const result: string[] = [];

  for (let i = 0; i < maxLen; i++) {
    const a = linesA[i] ?? '';
    const b = linesB[i] ?? '';
    if (a === b) {
      result.push(`  ${escapeHtml(a)}`);
    } else {
      if (a) { result.push(`<span style="background-color:#fecaca;color:#991b1b;">- ${escapeHtml(a)}</span>`); removed++; }
      if (b) { result.push(`<span style="background-color:#bbf7d0;color:#166534;">+ ${escapeHtml(b)}</span>`); added++; }
    }
  }

  diffResult.value = result.join('\n');
  diffStats.value = `+${added} -${removed}`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
</script>
