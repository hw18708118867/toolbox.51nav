<template>
  <div class="space-y-4">
    <TextInput v-model="jsonInput" label="输入 JSON" placeholder='{"name":"张三","age":25,"tags":["dev"]}' :rows="8" show-count />
    <div class="flex items-center gap-3">
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">根接口名称</label>
      <input v-model="rootName" type="text" placeholder="Root" class="w-48 rounded-md border px-3 py-1.5 text-sm focus:outline-none "  />
    </div>
    <div class="flex justify-end gap-2">
      <CopyButton v-if="output" :text="output" />
      <button @click="generate" class="btn-primary">生成</button>
    </div>
    <ErrorAlert :message="error" />
    <TextOutput v-model="output" label="TypeScript 接口" :rows="12" />
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

function jsTypeToTs(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    if (value.length > 0) {
      const itemType = jsTypeToTs(value[0]);
      return `${itemType}[]`;
    }
    return 'any[]';
  }
  const type = typeof value;
  switch (type) {
    case 'string': return 'string';
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'object': return generateInlineType(value);
    default: return 'any';
  }
}

function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_$]/g, '_')
    .split(/[_\-\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') || 'Unknown';
}

function generateInlineType(obj: Record<string, any>): string {
  if (!obj || typeof obj !== 'object' || Object.keys(obj).length === 0) return 'Record<string, any>';
  const fields = Object.entries(obj).map(([key, value]) => {
    const optional = value === null || value === undefined ? '?' : '';
    return `  ${key}${optional}: ${jsTypeToTs(value)};`;
  });
  return `{\n${fields.join('\n')}\n}`;
}

const childInterfaces = ref<string[]>([]);

function collectInterfaces(name: string, value: any): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && !Array.isArray(value[0])) {
      const childName = toPascalCase(name);
      collectInterfaces(childName, value[0]);
      return `${childName}[]`;
    }
    return `${jsTypeToTs(value[0] ?? 'any')}[]`;
  }
  if (typeof value === 'object') {
    const fields = Object.entries(value).map(([key, val]) => {
      let tsType: string;
      if (val === null || val === undefined) {
        tsType = 'any';
      } else if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null && !Array.isArray(val[0])) {
          const childName = toPascalCase(key);
          collectInterfaces(childName, val[0]);
          tsType = `${childName}[]`;
        } else {
          tsType = `${jsTypeToTs(val[0] ?? 'any')}[]`;
        }
      } else if (typeof val === 'object') {
        const childName = toPascalCase(key);
        collectInterfaces(childName, val);
        tsType = childName;
      } else {
        tsType = jsTypeToTs(val);
      }
      // Fields are optional if value could be null
      const optional = val === null || val === undefined ? '?' : '';
      return `  ${key}${optional}: ${tsType};`;
    });

    const iface = `interface ${name} {\n${fields.join('\n')}\n}`;
    childInterfaces.value.push(iface);
    return name;
  }
  return jsTypeToTs(value);
}

function generate() {
  error.value = '';
  output.value = '';
  childInterfaces.value = [];
  try {
    const parsed = JSON.parse(jsonInput.value);
    if (typeof parsed !== 'object' || parsed === null) {
      error.value = '请输入有效的 JSON 对象';
      return;
    }

    const rootType = collectInterfaces(rootName.value || 'Root', parsed);

    // Deduplicate interfaces
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const iface of childInterfaces.value) {
      if (!seen.has(iface)) {
        seen.add(iface);
        unique.push(iface);
      }
    }

    output.value = unique.join('\n\n');
  } catch (e: any) {
    error.value = '生成失败: ' + e.message;
  }
}
</script>
