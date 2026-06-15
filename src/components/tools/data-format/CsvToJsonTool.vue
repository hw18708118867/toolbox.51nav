<template>
  <div class="space-y-4">
    <TextInput v-model="csvInput" label="输入 CSV" placeholder="name,age,city&#10;张三,25,北京&#10;李四,30,上海" :rows="8" show-count />
    <div class="flex items-center gap-4">
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">分隔符</label>
      <select v-model="delimiter" class="rounded-md border px-3 py-1.5 text-sm" >
        <option value=",">逗号 (,)</option>
        <option value="\t">Tab</option>
        <option value=";">分号 (;)</option>
      </select>
      <label class="flex items-center gap-1.5 text-xs font-medium" style="color: var(--color-text-secondary);">
        <input v-model="hasHeaders" type="checkbox" class="rounded" />
        <span>包含表头</span>
      </label>
    </div>
    <div class="flex justify-end">
      <button @click="convert" class="btn-primary">转换</button>
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

const csvInput = ref('');
const delimiter = ref(',');
const hasHeaders = ref(true);
const output = ref('');
const error = ref('');

function parseCSVLine(line: string, delim: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delim && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function convert() {
  error.value = '';
  output.value = '';
  try {
    const delim = delimiter.value === '\\t' ? '\t' : delimiter.value;
    const lines = csvInput.value.trim().split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      error.value = '请输入有效的 CSV 数据';
      return;
    }

    let headers: string[];
    let dataStartIndex: number;

    if (hasHeaders.value) {
      headers = parseCSVLine(lines[0], delim);
      dataStartIndex = 1;
    } else {
      headers = parseCSVLine(lines[0], delim).map((_, i) => `column${i + 1}`);
      dataStartIndex = 0;
    }

    const result = [];
    for (let i = dataStartIndex; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], delim);
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      result.push(obj);
    }

    output.value = JSON.stringify(result, null, 2);
  } catch (e: any) {
    error.value = '转换失败: ' + e.message;
  }
}
</script>
