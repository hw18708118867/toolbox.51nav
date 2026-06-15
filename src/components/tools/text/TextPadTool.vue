<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要填充的文本" :rows="10" show-count />

    <div class="flex flex-wrap items-center gap-4">
      <select v-model="padSide" class="px-3 py-2 rounded-md border text-sm focus:outline-none " >
        <option value="left">左填充</option>
        <option value="right">右填充</option>
      </select>

      <div class="flex items-center gap-2">
        <label class="text-sm" style="color: var(--color-text-secondary);">填充字符:</label>
        <input v-model="padChar" type="text" maxlength="1" class="w-16 rounded-md border px-2 py-2 text-sm text-center focus:outline-none "  />
      </div>

      <div class="flex items-center gap-2">
        <label class="text-sm" style="color: var(--color-text-secondary);">目标长度:</label>
        <input v-model.number="targetLength" type="number" min="1" class="w-20 rounded-md border px-3 py-2 text-sm focus:outline-none "  />
      </div>
    </div>

    <div class="flex items-center gap-3">
    </div>

    <TextOutput v-model="output" label="填充结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');
const padSide = ref<'left' | 'right'>('left');
const padChar = ref(' ');
const targetLength = ref(10);

function padText() {
  if (input.value === '') {
    output.value = '';
    return;
  }
  const char = padChar.value || ' ';
  const len = targetLength.value || 1;
  output.value = input.value.split('\n').map(line => {
    if (padSide.value === 'left') {
      return line.padStart(len, char);
    } else {
      return line.padEnd(len, char);
    }
  }).join('\n');
}
</script>
