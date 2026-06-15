<template>
  <div class="space-y-4">
    <TextInput v-model="jsonInput" label="输入 JSON" placeholder='{"name":"张三","age":25,"tags":["dev"]}' :rows="8" show-count />
    <div class="flex items-center gap-3">
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">类名</label>
      <input v-model="className" type="text" placeholder="Root" class="w-48 rounded-md border px-3 py-1.5 text-sm focus:outline-none "  />
    </div>
    <div class="flex justify-end gap-2">
      <CopyButton v-if="output" :text="output" />
      <button @click="generate" class="btn-primary">生成</button>
    </div>
    <ErrorAlert :message="error" />
    <TextOutput v-model="output" label="Java POJO 类" :rows="14" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const jsonInput = ref('');
const className = ref('Root');
const output = ref('');
const error = ref('');

function jsTypeToJava(value: any): string {
  if (value === null) return 'Object';
  if (Array.isArray(value)) {
    if (value.length > 0) {
      const itemType = jsTypeToJava(value[0]);
      return `List<${itemType}>`;
    }
    return 'List<Object>';
  }
  switch (typeof value) {
    case 'string': return 'String';
    case 'number': return Number.isInteger(value) ? 'int' : 'double';
    case 'boolean': return 'boolean';
    case 'object': {
      // Will be replaced by class name reference
      return 'Object';
    }
    default: return 'Object';
  }
}

function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_$]/g, '_')
    .split(/[_\-\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') || 'Unknown';
}

const childClasses = ref<Map<string, string>>(new Map());

function collectClasses(name: string, value: any): string {
  if (value === null || value === undefined) return 'Object';
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && !Array.isArray(value[0])) {
      const childName = toPascalCase(name);
      collectClasses(childName, value[0]);
      return `List<${childName}>`;
    }
    return `List<${jsTypeToJava(value[0] ?? 'Object')}>`;
  }
  if (typeof value === 'object') {
    if (!childClasses.value.has(name)) {
      const fields: string[] = [];
      const getterSetters: string[] = [];

      for (const [key, val] of Object.entries(value)) {
        let javaType: string;
        const fieldName = toPascalCase(key);
        const camelName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);

        if (val === null || val === undefined) {
          javaType = 'Object';
        } else if (Array.isArray(val)) {
          if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null && !Array.isArray(val[0])) {
            const childName = toPascalCase(key);
            collectClasses(childName, val[0]);
            javaType = `List<${childName}>`;
          } else {
            javaType = `List<${jsTypeToJava(val[0] ?? 'Object')}>`;
          }
        } else if (typeof val === 'object') {
          const childName = toPascalCase(key);
          collectClasses(childName, val);
          javaType = childName;
        } else {
          javaType = jsTypeToJava(val);
        }

        fields.push(`    private ${javaType} ${camelName};`);

        getterSetters.push('');
        getterSetters.push(`    public ${javaType} get${fieldName}() {`);
        getterSetters.push(`        return ${camelName};`);
        getterSetters.push(`    }`);
        getterSetters.push('');
        getterSetters.push(`    public void set${fieldName}(${javaType} ${camelName}) {`);
        getterSetters.push(`        this.${camelName} = ${camelName};`);
        getterSetters.push(`    }`);
      }

      const classDef = [
        `public class ${name} {`,
        fields.join('\n'),
        getterSetters.join('\n'),
        `}`,
      ].join('\n');

      childClasses.value.set(name, classDef);
    }
    return name;
  }
  return jsTypeToJava(value);
}

function generate() {
  error.value = '';
  output.value = '';
  childClasses.value = new Map();
  try {
    const parsed = JSON.parse(jsonInput.value);
    if (typeof parsed !== 'object' || parsed === null) {
      error.value = '请输入有效的 JSON 对象';
      return;
    }

    collectClasses(className.value || 'Root', parsed);

    const classes = Array.from(childClasses.value.values());
    output.value = classes.join('\n\n');
  } catch (e: any) {
    error.value = '生成失败: ' + e.message;
  }
}
</script>
