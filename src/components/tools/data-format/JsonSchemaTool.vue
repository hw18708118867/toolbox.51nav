<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TextInput v-model="schemaInput" label="JSON Schema" placeholder='{"type":"object","required":["name"],"properties":{"name":{"type":"string","minLength":2},"age":{"type":"number","minimum":0}}}}' :rows="10" show-count />
      <TextInput v-model="dataInput" label="JSON 数据" placeholder='{"name":"张三","age":25}' :rows="10" show-count />
    </div>

    <div class="flex justify-end">
      <button @click="validate" :disabled="!schemaInput.trim() || !dataInput.trim()" class="btn-primary">验证</button>
    </div>

    <ErrorAlert :message="error" />

    <!-- Validation Results -->
    <div v-if="validationResult !== null" class="space-y-3">
      <!-- Overall Status -->
      <div :class="validationResult.valid ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'" class="rounded-md border p-3 text-sm font-medium">
        {{ validationResult.valid ? '验证通过 — 数据符合 Schema 约束' : '验证失败 — 数据不符合 Schema 约束' }}
      </div>

      <!-- Constraint Details -->
      <div v-if="validationResult.checks.length > 0" class="rounded-md border" style="background: var(--color-bg); border-color: var(--color-border);">
        <div class="p-3 border-b text-xs font-medium" style="border-color: var(--color-border); color: var(--color-text-secondary);">约束检查明细</div>
        <div class="divide-y max-h-80 overflow-auto" style="border-color: var(--color-border);">
          <div
            v-for="(check, idx) in validationResult.checks"
            :key="idx"
            class="flex items-start gap-2 px-3 py-2 text-sm"
            :style="{ color: check.pass ? '#166534' : '#991b1b' }"
          >
            <span class="shrink-0 mt-0.5">{{ check.pass ? '✓' : '✗' }}</span>
            <div>
              <span class="font-medium">{{ check.label }}</span>
              <span v-if="!check.pass" class="ml-2 opacity-80">— {{ check.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const schemaInput = ref('');
const dataInput = ref('');
const error = ref('');

interface CheckResult {
  label: string;
  pass: boolean;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  checks: CheckResult[];
}

const validationResult = ref<ValidationResult | null>(null);

function validate() {
  error.value = '';
  validationResult.value = null;

  try {
    const schema = JSON.parse(schemaInput.value);
    const data = JSON.parse(dataInput.value);
    const checks: CheckResult[] = [];

    validateNode(schema, data, '$', checks);

    const allPass = checks.every(c => c.pass);
    validationResult.value = { valid: allPass, checks };
  } catch (e: any) {
    error.value = '验证失败: ' + e.message;
  }
}

function validateNode(schema: any, data: any, path: string, checks: CheckResult[]) {
  if (schema === null || typeof schema !== 'object') return;

  // Type check
  if (schema.type) {
    const pass = checkType(schema.type, data);
    checks.push({
      label: `${path} 类型`,
      pass,
      message: pass ? `期望 ${schema.type}, 实际 ${getType(data)}` : `期望 ${schema.type}, 实际 ${getType(data)}`,
    });
    if (!pass) return; // If type doesn't match, skip further checks
  }

  // Enum check
  if (schema.enum !== undefined) {
    const pass = Array.isArray(schema.enum) && schema.enum.some((v: any) => JSON.stringify(v) === JSON.stringify(data));
    checks.push({
      label: `${path} 枚举值`,
      pass,
      message: pass ? '值在枚举列表中' : `值不在枚举列表 [${schema.enum.join(', ')}] 中`,
    });
  }

  // String constraints
  if (typeof data === 'string') {
    if (schema.minLength !== undefined) {
      const pass = data.length >= schema.minLength;
      checks.push({
        label: `${path} minLength`,
        pass,
        message: pass ? `长度 ${data.length} >= ${schema.minLength}` : `长度 ${data.length} < ${schema.minLength}`,
      });
    }
    if (schema.maxLength !== undefined) {
      const pass = data.length <= schema.maxLength;
      checks.push({
        label: `${path} maxLength`,
        pass,
        message: pass ? `长度 ${data.length} <= ${schema.maxLength}` : `长度 ${data.length} > ${schema.maxLength}`,
      });
    }
    if (schema.pattern) {
      try {
        const re = new RegExp(schema.pattern);
        const pass = re.test(data);
        checks.push({
          label: `${path} pattern`,
          pass,
          message: pass ? `匹配 /${schema.pattern}/` : `不匹配 /${schema.pattern}/`,
        });
      } catch {
        checks.push({ label: `${path} pattern`, pass: false, message: `无效的正则: ${schema.pattern}` });
      }
    }
  }

  // Number constraints
  if (typeof data === 'number') {
    if (schema.minimum !== undefined) {
      const pass = data >= schema.minimum;
      checks.push({
        label: `${path} minimum`,
        pass,
        message: pass ? `${data} >= ${schema.minimum}` : `${data} < ${schema.minimum}`,
      });
    }
    if (schema.maximum !== undefined) {
      const pass = data <= schema.maximum;
      checks.push({
        label: `${path} maximum`,
        pass,
        message: pass ? `${data} <= ${schema.maximum}` : `${data} > ${schema.maximum}`,
      });
    }
    // Check if integer is required
    if (schema.type === 'integer' && !Number.isInteger(data)) {
      checks.push({
        label: `${path} integer`,
        pass: false,
        message: `${data} 不是整数`,
      });
    }
  }

  // Required fields (for object)
  if (schema.required && Array.isArray(schema.required) && data !== null && typeof data === 'object' && !Array.isArray(data)) {
    for (const field of schema.required) {
      const pass = field in data;
      checks.push({
        label: `${path}.${field} required`,
        pass,
        message: pass ? '字段存在' : '缺少必需字段',
      });
    }
  }

  // Properties (for object)
  if (schema.properties && data !== null && typeof data === 'object' && !Array.isArray(data)) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in data) {
        validateNode(propSchema, data[key], `${path}.${key}`, checks);
      }
    }
  }

  // Items (for array)
  if (schema.items && Array.isArray(data)) {
    if (Array.isArray(schema.items)) {
      // Tuple validation: multiple schemas
      for (let idx = 0; idx < Math.min(schema.items.length, data.length); idx++) {
        validateNode(schema.items[idx], data[idx], `${path}[${idx}]`, checks);
      }
    } else {
      // Single schema for all items
      for (let idx = 0; idx < data.length; idx++) {
        validateNode(schema.items, data[idx], `${path}[${idx}]`, checks);
      }
    }
  }

  // Min/max items for array
  if (Array.isArray(data)) {
    if (schema.minItems !== undefined) {
      const pass = data.length >= schema.minItems;
      checks.push({
        label: `${path} minItems`,
        pass,
        message: pass ? `项数 ${data.length} >= ${schema.minItems}` : `项数 ${data.length} < ${schema.minItems}`,
      });
    }
    if (schema.maxItems !== undefined) {
      const pass = data.length <= schema.maxItems;
      checks.push({
        label: `${path} maxItems`,
        pass,
        message: pass ? `项数 ${data.length} <= ${schema.maxItems}` : `项数 ${data.length} > ${schema.maxItems}`,
      });
    }
  }

  // AdditionalProperties
  if (schema.additionalProperties === false && data !== null && typeof data === 'object' && !Array.isArray(data) && schema.properties) {
    const allowedKeys = Object.keys(schema.properties);
    for (const key of Object.keys(data)) {
      if (!allowedKeys.includes(key)) {
        checks.push({
          label: `${path}.${key}`,
          pass: false,
          message: `不允许的额外属性 "${key}"`,
        });
      }
    }
  }
}

function checkType(expected: string, data: any): boolean {
  switch (expected) {
    case 'string': return typeof data === 'string';
    case 'number': return typeof data === 'number';
    case 'integer': return Number.isInteger(data);
    case 'boolean': return typeof data === 'boolean';
    case 'array': return Array.isArray(data);
    case 'object': return data !== null && typeof data === 'object' && !Array.isArray(data);
    case 'null': return data === null;
    default: return true; // Unknown type, pass
  }
}

function getType(data: any): string {
  if (data === null) return 'null';
  if (Array.isArray(data)) return 'array';
  return typeof data;
}
</script>
