<template>
  <div class="space-y-4">
    <div class="flex items-end gap-3">
      <div class="flex-1">
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">输入值</label>
        <input
          v-model="inputValue"
          type="text"
          placeholder="输入数值"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none "
          
          @input="onInput"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">输入进制</label>
        <select
          v-model="fromBase"
          class="rounded-md border px-3 py-2 text-sm focus:outline-none "
          
          @change="onInput"
        >
          <option v-for="b in bases" :key="b" :value="b">{{ b }} 进制</option>
        </select>
      </div>
    </div>

    <ErrorAlert :message="error" />

    <div class="flex items-end gap-3">
      <div class="flex-1">
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">输出值</label>
        <input
          :value="convertedValue"
          type="text"
          readonly
          class="w-full rounded-md border px-3 py-2 text-sm font-mono"
          style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">输出进制</label>
        <select
          v-model="toBase"
          class="rounded-md border px-3 py-2 text-sm focus:outline-none "
          
          @change="onInput"
        >
          <option v-for="b in bases" :key="b" :value="b">{{ b }} 进制</option>
        </select>
      </div>
    </div>

    <div v-if="convertedValue" class="flex justify-end">
      <CopyButton :text="convertedValue" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const inputValue = ref('');
const fromBase = ref(10);
const toBase = ref(2);
const error = ref('');

const bases = Array.from({ length: 35 }, (_, i) => i + 2);

const convertedValue = computed(() => {
  error.value = '';
  if (!inputValue.value.trim()) return '';

  const val = parseInt(inputValue.value.trim(), fromBase.value);
  if (isNaN(val)) {
    error.value = '输入不是有效的 ' + fromBase.value + ' 进制数';
    return '';
  }
  return val.toString(toBase.value).toUpperCase();
});

function onInput() {
  // Trigger recomputation
}
</script>
