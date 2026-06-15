<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">输入数字</label>
      <div class="flex gap-2">
        <input v-model="input" type="text" placeholder="输入数字" class="flex-1 rounded-md border px-3 py-2 text-sm font-mono focus:outline-none "  />
        <select v-model="fromBase" class="rounded-md border px-3 py-2 text-sm" >
          <option :value="2">二进制</option>
          <option :value="8">八进制</option>
          <option :value="10">十进制</option>
          <option :value="16">十六进制</option>
        </select>
      </div>
    </div>

    <ErrorAlert :message="error" />

    <div v-if="decimalValue !== null" class="grid grid-cols-2 gap-3">
      <div v-for="r in results" :key="r.label" class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-medium" style="color: var(--color-text-secondary);">{{ r.label }}</span>
          <CopyButton :text="r.value" />
        </div>
        <code class="text-sm font-mono break-all" style="color: var(--color-text);">{{ r.value }}</code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const input = ref('');
const fromBase = ref(10);
const error = ref('');

const decimalValue = computed(() => {
  error.value = '';
  if (!input.value.trim()) return null;
  try {
    const val = parseInt(input.value.trim(), fromBase.value);
    if (isNaN(val)) {
      error.value = '输入不是有效的 ' + fromBase.value + ' 进制数';
      return null;
    }
    return val;
  } catch {
    error.value = '转换失败';
    return null;
  }
});

const results = computed(() => {
  if (decimalValue.value === null) return [];
  const val = decimalValue.value;
  return [
    { label: '二进制 (BIN)', value: val.toString(2) },
    { label: '八进制 (OCT)', value: val.toString(8) },
    { label: '十进制 (DEC)', value: val.toString(10) },
    { label: '十六进制 (HEX)', value: val.toString(16).toUpperCase() },
  ];
});
</script>
