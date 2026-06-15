<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要计算 CRC32 的文本" :rows="4" show-count />

    <div class="flex justify-end">
      <button
        @click="calculate"
        :disabled="!input.trim()"
        class="btn-primary"
      >
        计算
      </button>
    </div>

    <div v-if="output">
      <div class="flex items-center justify-between mb-1.5">
        <label class="text-xs font-medium" style="color: var(--color-text-secondary);">CRC32 结果 (HEX)</label>
        <CopyButton :text="output" />
      </div>
      <div
        class="w-full rounded-md border px-3 py-2 text-sm font-mono"
        style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text);"
      >{{ output }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import CopyButton from '../../common/CopyButton.vue';

const input = ref('');
const output = ref('');

function crc32(str: string): string {
  let table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  let crc = 0xFFFFFFFF;
  for (let i = 0; i < str.length; i++) {
    crc = table[(crc ^ str.charCodeAt(i)) & 0xFF] ^ (crc >>> 8);
  }
  crc = (crc ^ 0xFFFFFFFF) >>> 0;

  return crc.toString(16).toUpperCase().padStart(8, '0');
}

function calculate() {
  output.value = crc32(input.value);
}
</script>
