<template>
  <div class="space-y-4">
    <TextInput v-model="tomlInput" label="输入 TOML" placeholder="key = &quot;value&quot;" :rows="10" show-count />
    <div class="flex justify-end">
      <button @click="convert" class="btn-primary">转换为 JSON</button>
    </div>
    <ErrorAlert :message="error" />
    <TextOutput v-model="output" label="JSON 结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const tomlInput = ref('');
const output = ref('');
const error = ref('');

function parseTomlValue(val: string): any {
  val = val.trim();

  // String
  if (val.startsWith('"') && val.endsWith('"')) {
    return JSON.parse(val);
  }
  // Boolean
  if (val === 'true') return true;
  if (val === 'false') return false;
  // Null-like
  if (val === '' || val === '""') return null;
  // Array
  if (val.startsWith('[') && val.endsWith(']')) {
    const inner = val.slice(1, -1);
    if (!inner.trim()) return [];
    return inner.split(',').map(v => parseTomlValue(v));
  }
  // Number
  if (!isNaN(Number(val))) return Number(val);
  // Fallback to string
  return val;
}

function convert() {
  error.value = '';
  try {
    const lines = tomlInput.value.split(/\r?\n/);
    const result: Record<string, any> = {};
    let currentTable = result;
    let currentPath = '';

    for (let line of lines) {
      line = line.trim();

      // Skip comments and empty lines
      if (!line || line.startsWith('#')) continue;

      // Table header
      const tableMatch = line.match(/^\[([^\]]+)\]$/);
      if (tableMatch) {
        currentPath = tableMatch[1].trim();
        const parts = currentPath.split('.');
        currentTable = result;
        for (const part of parts) {
          if (!currentTable[part]) {
            currentTable[part] = {};
          }
          currentTable = currentTable[part];
        }
        continue;
      }

      // Key-value pair
      const eqIndex = line.indexOf('=');
      if (eqIndex === -1) continue;

      const key = line.substring(0, eqIndex).trim();
      const value = line.substring(eqIndex + 1).trim();
      currentTable[key] = parseTomlValue(value);
    }

    output.value = JSON.stringify(result, null, 2);
  } catch (e: any) {
    error.value = '转换失败: ' + e.message;
  }
}
</script>
