<template>
  <div class="space-y-4">
    <TextInput v-model="jsonInput" label="输入 JSON" placeholder='{"key": "value"}' :rows="10" show-count />
    <div class="flex justify-end">
      <button @click="convert" class="btn-primary">转换为 TOML</button>
    </div>
    <ErrorAlert :message="error" />
    <TextOutput v-model="output" label="TOML 结果" :rows="10" />
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

function toToml(obj: any, prefix: string = ''): string {
  if (obj === null || obj === undefined) return '# null';

  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return String(JSON.stringify(obj));
  }

  const lines: string[] = [];

  // Check if there are nested objects
  const nestedKeys: string[] = [];
  const simpleEntries: [string, any][] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      nestedKeys.push(key);
    } else {
      simpleEntries.push([key, value]);
    }
  }

  // Write simple entries first
  for (const [key, value] of simpleEntries) {
    lines.push(`${key} = ${formatTomlValue(value)}`);
  }

  // Write nested tables
  for (const key of nestedKeys) {
    const tableKey = prefix ? `${prefix}.${key}` : key;
    lines.push('');
    lines.push(`[${tableKey}]`);
    lines.push(toToml(obj[key], tableKey));
  }

  return lines.join('\n');
}

function formatTomlValue(value: any): string {
  if (value === null || value === undefined) return '""';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    return '[' + value.map(v => formatTomlValue(v)).join(', ') + ']';
  }
  return String(value);
}

function convert() {
  error.value = '';
  try {
    const obj = JSON.parse(jsonInput.value);
    if (typeof obj !== 'object' || obj === null) {
      error.value = '请输入有效的 JSON 对象';
      return;
    }
    output.value = toToml(obj);
  } catch (e: any) {
    error.value = '转换失败: ' + e.message;
  }
}
</script>
