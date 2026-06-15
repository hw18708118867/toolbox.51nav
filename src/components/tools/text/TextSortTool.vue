<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要排序的文本（每行一个条目）" :rows="10" show-count />
    <div class="flex flex-wrap items-center gap-3">
      <select v-model="sortMode" class="px-3 py-2 rounded-md border text-sm focus:outline-none " >
        <option value="asc">升序</option>
        <option value="desc">降序</option>
        <option value="reverse">反序</option>
      </select>
    </div>
    <TextOutput v-model="output" label="排序结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');
const sortMode = ref<'asc' | 'desc' | 'reverse'>('asc');

function sortLines() {
  if (input.value === '') {
    output.value = '';
    return;
  }
  const lines = input.value.split('\n');
  switch (sortMode.value) {
    case 'asc':
      output.value = [...lines].sort().join('\n');
      break;
    case 'desc':
      output.value = [...lines].sort().reverse().join('\n');
      break;
    case 'reverse':
      output.value = [...lines].reverse().join('\n');
      break;
  }
}
</script>
