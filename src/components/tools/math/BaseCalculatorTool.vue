<template>
  <div class="space-y-4">
    <div class="flex gap-2">
      <input
        v-model="input"
        type="text"
        placeholder="输入数字"
        class="flex-1 rounded-md border px-3 py-2 text-sm font-mono focus:outline-none "
        
        @input="onInput"
      />
      <select
        v-model="fromBase"
        class="rounded-md border px-3 py-2 text-sm"
        
        @change="onInput"
      >
        <option v-for="b in bases" :key="b" :value="b">{{ b }} 进制</option>
      </select>
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

const bases = Array.from({ length: 35 }, (_, i) => i + 2);

const decimalValue = ref<number | null>(null);

const results = computed(() => {
  if (decimalValue.value === null) return [];
  const val = decimalValue.value;
  return [
    { label: '二进制 (BIN, Base 2)', value: val.toString(2) },
    { label: '八进制 (OCT, Base 8)', value: val.toString(8) },
    { label: '十进制 (DEC, Base 10)', value: val.toString(10) },
    { label: '十六进制 (HEX, Base 16)', value: val.toString(16).toUpperCase() },
  ];
});

function onInput() {
  error.value = '';
  decimalValue.value = null;
  if (!input.value.trim()) return;

  const val = parseInt(input.value.trim(), fromBase.value);
  if (isNaN(val)) {
    error.value = '输入不是有效的 ' + fromBase.value + ' 进制数';
    return;
  }
  decimalValue.value = val;
}
</script>
