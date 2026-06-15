<template>
  <div class="space-y-4">
    <TextInput v-model="csvInput" label="输入 CSV" placeholder="name,age,city&#10;张三,25,北京&#10;李四,30,上海" :rows="8" show-count />

    <div class="flex items-center gap-4">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">表名</label>
        <input
          v-model="tableName"
          type="text"
          placeholder="users"
          class="w-48 rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        />
      </div>
      <label class="flex items-center gap-1.5 text-xs font-medium" style="color: var(--color-text-secondary);">
        <input v-model="hasHeaders" type="checkbox" class="rounded" checked />
        <span>包含表头</span>
      </label>
    </div>

    <div class="flex justify-end">
      <button @click="convert" class="btn-primary">转换</button>
    </div>

    <ErrorAlert :message="error" />

    <TextOutput v-model="output" label="SQL INSERT 语句" :rows="12" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const csvInput = ref('');
const tableName = ref('table_name');
const hasHeaders = ref(true);
const output = ref('');
const error = ref('');

function convert() {
  error.value = '';
  output.value = '';
  try {
    const lines = csvInput.value.trim().split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) {
      error.value = '请输入有效的 CSV 数据';
      return;
    }

    let headers: string[];
    let dataStart: number;

    if (hasHeaders.value) {
      headers = lines[0].split(',').map(h => h.trim());
      dataStart = 1;
    } else {
      const cols = lines[0].split(',').length;
      headers = Array.from({ length: cols }, (_, i) => `column_${i + 1}`);
      dataStart = 0;
    }

    const safeTableName = tableName.value || 'table_name';
    const columnList = headers.map(h => '`' + h.replace(/`/g, '``') + '`').join(', ');

    const sqlStatements: string[] = [];
    for (let i = dataStart; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => {
        const val = v.trim();
        // Try parsing as number
        if (/^-?\d+(\.\d+)?$/.test(val)) return val;
        // Escape single quotes
        return "'" + val.replace(/'/g, "''") + "'";
      }).join(', ');
      sqlStatements.push(`INSERT INTO \`${safeTableName}\` (${columnList}) VALUES (${values});`);
    }

    output.value = sqlStatements.join('\n');
  } catch (e: any) {
    error.value = '转换失败: ' + e.message;
  }
}
</script>
