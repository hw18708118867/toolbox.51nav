<template>
  <div class="space-y-4">
    <TabView :tabs="['压缩', '格式化']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="compressInput" label="输入 CSS" placeholder="在此粘贴 CSS 代码..." :rows="12" show-count />

          <div class="flex justify-end">
            <button
              @click="minify"
              :disabled="!compressInput.trim()"
              class="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              压缩
            </button>
          </div>

          <div v-if="compressOutput" class="rounded-md border p-3 flex items-center gap-3" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
            <span class="text-sm" style="color: var(--color-text-secondary);">
              原始大小: {{ formatSize(compressInput.length) }} → 压缩后: {{ formatSize(compressOutput.length) }}
              （减少 {{ compressRatio }}%）
            </span>
          </div>

          <TextOutput v-model="compressOutput" label="压缩结果" :rows="10" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="formatInput" label="输入 CSS" placeholder="在此粘贴 CSS 代码..." :rows="12" show-count />

          <div class="flex justify-end">
            <button
              @click="beautify"
              :disabled="!formatInput.trim()"
              class="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              格式化
            </button>
          </div>

          <TextOutput v-model="formatOutput" label="格式化结果" :rows="12" />
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import TabView from '../../common/TabView.vue';

const compressInput = ref('');
const compressOutput = ref('');

const formatInput = ref('');
const formatOutput = ref('');

const compressRatio = computed(() => {
  if (!compressInput.value.length || !compressOutput.value.length) return '0';
  return ((1 - compressOutput.value.length / compressInput.value.length) * 100).toFixed(1);
});

function formatSize(len: number): string {
  if (len < 1024) return len + ' 字符';
  return (len / 1024).toFixed(1) + ' KB';
}

function minify() {
  let css = compressInput.value;

  // Remove comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove whitespace around special characters
  css = css.replace(/\s*([{}:;,])\s*/g, '$1');

  // Remove whitespace before/after {
  css = css.replace(/\{\s*/g, '{');

  // Remove whitespace before }
  css = css.replace(/\s*\}/g, '}');

  // Remove last semicolon in a block
  css = css.replace(/;\}/g, '}');

  // Collapse multiple spaces
  css = css.replace(/\s{2,}/g, ' ');

  // Remove newlines
  css = css.replace(/\n/g, '');

  // Trim
  css = css.trim();

  compressOutput.value = css;
}

function beautify() {
  let css = formatInput.value;
  const indentSize = 2;
  let indentLevel = 1;
  let result = '';

  // Normalize whitespace first
  css = css.replace(/\r\n/g, '\n');

  // First pass: ensure we have clean separators
  // Remove existing newlines but keep structural positions
  css = css.replace(/\n/g, '');
  css = css.replace(/\s*,\s*/g, ', ');

  // Process character by character
  let i = 0;
  while (i < css.length) {
    const char = css[i];

    // Skip leading whitespace
    if (result.endsWith('\n')) {
      while (i < css.length && (css[i] === ' ' || css[i] === '\t')) {
        i++;
      }
      if (i >= css.length) break;
    }

    if (char === '{') {
      result += ' {\n' + ' '.repeat(indentLevel * indentSize);
      indentLevel++;
      i++;
    } else if (char === '}') {
      indentLevel = Math.max(0, indentLevel - 1);
      result = result.trimEnd();
      result += '\n' + ' '.repeat(indentLevel * indentSize) + '}\n';
      if (indentLevel > 0) {
        result += ' '.repeat(indentLevel * indentSize);
      } else {
        result += '\n';
      }
      i++;
    } else if (char === ';') {
      result += ';\n' + ' '.repeat(indentLevel * indentSize);
      i++;
    } else if (char === ':') {
      result += ': ';
      i++;
    } else {
      result += char;
      i++;
    }
  }

  // Clean up: remove multiple blank lines
  result = result.replace(/\n{3,}/g, '\n\n');
  // Clean trailing whitespace on each line
  result = result.split('\n').map(line => line.trimEnd()).join('\n');
  formatOutput.value = result.trim();
}
</script>
