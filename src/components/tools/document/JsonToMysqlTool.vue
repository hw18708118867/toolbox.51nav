<template>
  <div class="space-y-4">
    <TextInput v-model="jsonInput" label="输入 JSON" placeholder='{"name":"张三","age":25,"email":"test@example.com"}' :rows="8" show-count />
    <div class="flex items-center gap-3">
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">表名</label>
      <input v-model="tableName" type="text" placeholder="my_table" class="w-48 rounded-md border px-3 py-1.5 text-sm focus:outline-none "  />
    </div>
    <div class="flex justify-end gap-2">
      <CopyButton v-if="output" :text="output" />
      <button @click="generate" class="btn-primary">生成</button>
    </div>
    <ErrorAlert :message="error" />
    <TextOutput v-model="output" label="MySQL CREATE TABLE" :rows="12" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const jsonInput = ref('');
const tableName = ref('my_table');
const output = ref('');
const error = ref('');

function inferSqlType(key: string, value: any): string {
  if (value === null || value === undefined) return 'TEXT';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'INT' : 'DOUBLE';
  }
  if (typeof value === 'boolean') return 'TINYINT(1)';
  if (typeof value === 'string') {
    if (value.length > 255) return 'TEXT';
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'DATE';
    if (/@/.test(value)) return 'VARCHAR(255)';
    return `VARCHAR(${Math.max(50, value.length * 2)})`;
  }
  if (typeof value === 'object') return 'JSON';
  return 'TEXT';
}

function generate() {
  error.value = '';
  output.value = '';
  try {
    const parsed = JSON.parse(jsonInput.value);
    if (typeof parsed !== 'object' || parsed === null) {
      error.value = '请输入有效的 JSON 对象';
      return;
    }

    const safeTable = (tableName.value || 'my_table').replace(/`/g, '``');
    const columns: string[] = ['  `id` INT AUTO_INCREMENT PRIMARY KEY'];

    for (const [key, value] of Object.entries(parsed)) {
      const safeKey = key.replace(/`/g, '``');
      const sqlType = inferSqlType(key, value);
      columns.push(`  \`${safeKey}\` ${sqlType}`);
    }

    const sql = [
      `CREATE TABLE \`${safeTable}\` (`,
      columns.join(',\n'),
      `);`,
    ].join('\n');

    output.value = sql;
  } catch (e: any) {
    error.value = '生成失败: ' + e.message;
  }
}
</script>
