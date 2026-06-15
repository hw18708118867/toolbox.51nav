<template>
  <div class="space-y-4">
    <TextInput v-model="jsonInput" label="输入 JSON 数组" placeholder='[{"name":"张三","age":25},{"name":"李四","age":30}]' :rows="8" show-count />
    <div class="flex justify-end">
      <button @click="convert" class="btn-primary">转换</button>
    </div>
    <ErrorAlert :message="error" />
    <TextOutput v-model="output" label="CSV 结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const jsonInput = ref('');
const output = ref('');
const error = ref('');

function escapeCSV(value: any): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function convert() {
  error.value = '';
  output.value = '';
  try {
    const parsed = JSON.parse(jsonInput.value);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      error.value = '请输入有效的 JSON 数组（非空数组）';
      return;
    }

    // Auto-detect keys from all objects
    const keysSet = new Set<string>();
    for (const item of parsed) {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(k => keysSet.add(k));
      }
    }
    const keys = Array.from(keysSet);

    if (keys.length === 0) {
      error.value = '未找到任何键';
      return;
    }

    const lines: string[] = [];
    // Header row
    lines.push(keys.map(k => escapeCSV(k)).join(','));

    // Data rows
    for (const item of parsed) {
      if (typeof item === 'object' && item !== null) {
        lines.push(keys.map(k => escapeCSV((item as any)[k])).join(','));
      }
    }

    output.value = lines.join('\n');
  } catch (e: any) {
    error.value = '转换失败: ' + e.message;
  }
}
</script>
