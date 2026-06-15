<template>
  <div class="space-y-4">
    <TextInput v-model="jsonInput" label="输入 JSON" placeholder='{"name":"张三","age":25,"tags":["dev"]}' :rows="8" show-count />
    <div class="flex items-center gap-3">
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">根结构体名称</label>
      <input v-model="rootName" type="text" placeholder="Root" class="w-48 rounded-md border px-3 py-1.5 text-sm focus:outline-none "  />
    </div>
    <div class="flex justify-end gap-2">
      <CopyButton v-if="output" :text="output" />
      <button @click="generate" class="btn-primary">生成</button>
    </div>
    <ErrorAlert :message="error" />
    <TextOutput v-model="output" label="Go 结构体" :rows="12" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const jsonInput = ref('');
const rootName = ref('Root');
const output = ref('');
const error = ref('');

const childStructs = ref<string[]>([]);

function jsTypeToGo(value: any): string {
  if (value === null || value === undefined) return 'interface{}';
  if (Array.isArray(value)) {
    if (value.length > 0) {
      return '[]' + jsTypeToGo(value[0]);
    }
    return '[]interface{}';
  }
  switch (typeof value) {
    case 'string': return 'string';
    case 'number':
      return Number.isInteger(value) ? 'int' : 'float64';
    case 'boolean': return 'bool';
    case 'object': return 'map[string]interface{}';
    default: return 'interface{}';
  }
}

function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_$]/g, '_')
    .split(/[_\-\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') || 'Unknown';
}

function toGoTag(key: string): string {
  return `json:"${key}"`;
}

function collectStructs(name: string, value: any): string {
  if (value === null || value === undefined) return 'interface{}';
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && !Array.isArray(value[0])) {
      const childName = toPascalCase(name);
      collectStructs(childName, value[0]);
      return '[]' + childName;
    }
    return '[]' + jsTypeToGo(value[0] ?? 'interface{}');
  }
  if (typeof value === 'object') {
    const fields = Object.entries(value).map(([key, val]) => {
      let goType: string;
      if (val === null || val === undefined) {
        goType = 'interface{}';
      } else if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null && !Array.isArray(val[0])) {
          const childName = toPascalCase(key);
          collectStructs(childName, val[0]);
          goType = '[]' + childName;
        } else {
          goType = '[]' + jsTypeToGo(val[0] ?? 'interface{}');
        }
      } else if (typeof val === 'object') {
        const childName = toPascalCase(key);
        collectStructs(childName, val);
        goType = childName;
      } else {
        goType = jsTypeToGo(val);
      }
      const fieldName = toPascalCase(key);
      return `\t${fieldName} ${goType} \`${toGoTag(key)}\``;
    });

    const struct = `type ${name} struct {\n${fields.join('\n')}\n}`;
    childStructs.value.push(struct);
    return name;
  }
  return jsTypeToGo(value);
}

function generate() {
  error.value = '';
  output.value = '';
  childStructs.value = [];
  try {
    const parsed = JSON.parse(jsonInput.value);
    if (typeof parsed !== 'object' || parsed === null) {
      error.value = '请输入有效的 JSON 对象';
      return;
    }

    collectStructs(rootName.value || 'Root', parsed);

    // Deduplicate structs
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const s of childStructs.value) {
      if (!seen.has(s)) {
        seen.add(s);
        unique.push(s);
      }
    }

    output.value = unique.join('\n\n');
  } catch (e: any) {
    error.value = '生成失败: ' + e.message;
  }
}
</script>
