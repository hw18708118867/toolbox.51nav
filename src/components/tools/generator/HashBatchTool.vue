<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本 (每行一项)" placeholder="Hello World&#10;你好世界&#10;123456" :rows="8" show-count />

    <div class="flex items-center gap-4 flex-wrap">
      <div class="flex items-center gap-2">
        <label class="text-xs font-medium" style="color: var(--color-text-secondary);">哈希算法</label>
        <select v-model="algorithm" class="rounded-md border px-3 py-1.5 text-sm" style="background: var(--color-bg); color: var(--color-text); border-color: var(--color-border);">
          <option value="MD5">MD5</option>
          <option value="SHA-1">SHA-1</option>
          <option value="SHA-256">SHA-256</option>
          <option value="SHA-512">SHA-512</option>
          <option value="SHA-3">SHA-3 (SHA3-256)</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label class="text-xs font-medium" style="color: var(--color-text-secondary);">输出格式</label>
        <select v-model="outputFormat" class="rounded-md border px-3 py-1.5 text-sm" style="background: var(--color-bg); color: var(--color-text); border-color: var(--color-border);">
          <option value="pair">原始值 → 哈希值</option>
          <option value="hash_only">仅哈希值</option>
          <option value="csv">CSV (原始值, 哈希值)</option>
        </select>
      </div>

      <label class="flex items-center gap-1 text-sm cursor-pointer" style="color: var(--color-text);">
        <input type="checkbox" v-model="uppercase" /> 大写输出
      </label>
    </div>

    <div class="flex justify-end gap-2">
      <CopyButton v-if="output" :text="output" />
      <button @click="generate" :disabled="!input.trim()" class="btn-primary">生成哈希</button>
    </div>

    <ErrorAlert :message="error" />

    <!-- Stats -->
    <div v-if="stats" class="text-xs" style="color: var(--color-text-muted);">
      共处理 {{ stats.total }} 行, {{ stats.nonEmpty }} 个有效项
    </div>

    <TextOutput v-model="output" label="哈希结果" :rows="12" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CryptoJS from 'crypto-js';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const input = ref('');
const output = ref('');
const error = ref('');
const algorithm = ref('SHA-256');
const outputFormat = ref('pair');
const uppercase = ref(false);
const stats = ref<{ total: number; nonEmpty: number } | null>(null);

function generate() {
  error.value = '';
  output.value = '';
  stats.value = null;

  try {
    const lines = input.value.split('\n');
    const nonEmptyLines = lines.filter(l => l.trim().length > 0);
    const results: string[] = [];

    for (const line of nonEmptyLines) {
      const trimmed = line.trim();
      const hash = computeHash(trimmed, algorithm.value);

      switch (outputFormat.value) {
        case 'pair':
          results.push(`${trimmed} → ${hash}`);
          break;
        case 'hash_only':
          results.push(hash);
          break;
        case 'csv':
          // Escape CSV if needed
          const escaped = trimmed.includes(',') || trimmed.includes('"') ? `"${trimmed.replace(/"/g, '""')}"` : trimmed;
          results.push(`${escaped},${hash}`);
          break;
      }
    }

    stats.value = {
      total: lines.length,
      nonEmpty: nonEmptyLines.length,
    };

    output.value = results.join('\n');
  } catch (e: any) {
    error.value = '生成失败: ' + e.message;
  }
}

function computeHash(text: string, algo: string): string {
  let hash: string;

  switch (algo) {
    case 'MD5':
      hash = CryptoJS.MD5(text).toString();
      break;
    case 'SHA-1':
      hash = CryptoJS.SHA1(text).toString();
      break;
    case 'SHA-256':
      hash = CryptoJS.SHA256(text).toString();
      break;
    case 'SHA-512':
      hash = CryptoJS.SHA512(text).toString();
      break;
    case 'SHA-3':
      hash = CryptoJS.SHA3(text, { outputLength: 256 }).toString();
      break;
    default:
      hash = CryptoJS.SHA256(text).toString();
  }

  return uppercase.value ? hash.toUpperCase() : hash;
}
</script>
