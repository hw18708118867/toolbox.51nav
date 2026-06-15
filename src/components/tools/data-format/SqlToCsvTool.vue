<template>
  <div class="space-y-4">
    <TextInput v-model="sqlInput" label="输入 SQL INSERT" placeholder="INSERT INTO users (name, age) VALUES ('张三', 25);" :rows="10" show-count />

    <div class="flex justify-end">
      <button @click="convert" class="btn-primary">转换为 CSV</button>
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

const sqlInput = ref('');
const output = ref('');
const error = ref('');

function convert() {
  error.value = '';
  output.value = '';
  try {
    const text = sqlInput.value.replace(/\r?\n/g, ' ');

    // Match INSERT INTO ... (columns) VALUES (values), (...);
    const match = text.match(/INSERT\s+INTO\s+\S+\s*\(([^)]+)\)\s*VALUES\s*(.+)/i);
    if (!match) {
      error.value = '无法解析 SQL INSERT 语句';
      return;
    }

    const columns = match[1].split(',').map(c => c.trim().replace(/`/g, ''));

    // Extract value groups
    const valuesStr = match[2].replace(/;\s*$/i, '');
    const groups: string[] = [];
    let depth = 0;
    let current = '';
    for (const ch of valuesStr) {
      if (ch === '(') {
        depth++;
        if (depth === 1) continue;
      }
      if (ch === ')') {
        depth--;
        if (depth === 0) {
          groups.push(current.trim());
          current = '';
          continue;
        }
      }
      if (depth > 0) current += ch;
    }

    const csvRows = [columns.join(',')];

    for (const group of groups) {
      const values = parseValues(group);
      csvRows.push(values.join(','));
    }

    output.value = csvRows.join('\n');
  } catch (e: any) {
    error.value = '转换失败: ' + e.message;
  }
}

function parseValues(group: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuote = false;
  for (const ch of group) {
    if (ch === "'" && !inQuote) {
      inQuote = true;
      continue;
    }
    if (ch === "'" && inQuote) {
      inQuote = false;
      continue;
    }
    if (ch === ',' && !inQuote) {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}
</script>
