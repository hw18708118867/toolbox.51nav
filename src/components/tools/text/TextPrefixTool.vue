<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要处理的文本" :rows="10" show-count />

    <div class="flex flex-wrap items-center gap-4">
      <label class="flex items-center gap-2 text-sm cursor-pointer" style="color: var(--color-text-secondary);">
        <input v-model="useLineNumber" type="checkbox" class="rounded" />
        添加行号
      </label>
      <select v-if="useLineNumber" v-model="lineNumFormat" class="px-3 py-2 rounded-md border text-sm focus:outline-none " >
        <option value="1">1</option>
        <option value="01">01</option>
      </select>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium mb-1" style="color: var(--color-text-secondary);">添加前缀</label>
        <input v-model="prefix" :disabled="useLineNumber" type="text" placeholder="请输入前缀" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none  disabled:opacity-50"  />
      </div>
      <div>
        <label class="block text-xs font-medium mb-1" style="color: var(--color-text-secondary);">添加后缀</label>
        <input v-model="suffix" :disabled="useLineNumber" type="text" placeholder="请输入后缀" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none  disabled:opacity-50"  />
      </div>
    </div>

    <div class="flex items-center gap-3">
    </div>

    <TextOutput v-model="output" label="处理结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');
const useLineNumber = ref(false);
const lineNumFormat = ref<'1' | '01'>('1');
const prefix = ref('');
const suffix = ref('');

function applyPrefix() {
  if (input.value === '') {
    output.value = '';
    return;
  }
  const lines = input.value.split('\n');
  if (useLineNumber.value) {
    const digits = lineNumFormat.value === '01' ? 2 : 0;
    output.value = lines.map((line, i) => {
      const num = String(i + 1).padStart(digits, '0') + '. ';
      return num + line;
    }).join('\n');
  } else {
    output.value = lines.map(line => prefix.value + line + suffix.value).join('\n');
  }
}
</script>
