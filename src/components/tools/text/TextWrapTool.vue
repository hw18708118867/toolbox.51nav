<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要换行的文本" :rows="10" show-count />

    <div class="flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-sm" style="color: var(--color-text-secondary);">每行最大字符数:</label>
        <input v-model.number="wrapLength" type="number" min="1" class="w-20 rounded-md border px-3 py-2 text-sm focus:outline-none "  />
      </div>
    </div>

    <div class="flex items-center gap-3">
    </div>

    <TextOutput v-model="output" label="换行结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');
const wrapLength = ref(80);

function wrapText() {
  if (input.value === '') {
    output.value = '';
    return;
  }
  const len = Math.max(1, wrapLength.value);
  const text = input.value.replace(/\n/g, ' ');
  const result: string[] = [];
  for (let i = 0; i < text.length; i += len) {
    result.push(text.slice(i, i + len));
  }
  output.value = result.join('\n');
}
</script>
