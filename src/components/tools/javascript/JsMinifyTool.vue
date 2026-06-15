<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入 JavaScript" placeholder="在此粘贴 JavaScript 代码..." :rows="12" show-count />

    <div class="flex justify-end">
      <button
        @click="minify"
        :disabled="!input.trim()"
        class="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        压缩
      </button>
    </div>

    <div v-if="output" class="rounded-md border p-3 flex items-center gap-3" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <span class="text-sm" style="color: var(--color-text-secondary);">
        原始大小: {{ formatSize(input.length) }} → 压缩后: {{ formatSize(output.length) }}
        （减少 {{ ratio }}%）
      </span>
    </div>

    <TextOutput v-model="output" label="压缩结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');

const ratio = computed(() => {
  if (!input.value.length || !output.value.length) return '0';
  return ((1 - output.value.length / input.value.length) * 100).toFixed(1);
});

function formatSize(len: number): string {
  if (len < 1024) return len + ' 字符';
  return (len / 1024).toFixed(1) + ' KB';
}

function minify() {
  try {
    let code = input.value;

    // Remove single-line comments (but not URLs)
    code = code.replace(/\/\/\s.*$/gm, '');

    // Remove multi-line comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove extra whitespace
    code = code.replace(/[ \t]+/g, ' ');

    // Remove newlines
    code = code.replace(/\n\s*/g, '');

    // Remove spaces around operators
    code = code.replace(/\s*([=+\-*/%&|^<>!?:;,{}()[\]~])\s*/g, '$1');

    // Collapse multiple spaces
    code = code.replace(/\s{2,}/g, ' ');

    // Remove leading/trailing whitespace
    code = code.trim();

    output.value = code;
  } catch (e: any) {
    output.value = '';
  }
}
</script>
