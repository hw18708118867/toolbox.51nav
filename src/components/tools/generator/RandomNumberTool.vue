<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">最小值</label>
        <input
          v-model.number="minValue"
          type="number"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">最大值</label>
        <input
          v-model.number="maxValue"
          type="number"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        />
      </div>
    </div>

    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">数值类型</label>
      <div class="flex gap-3">
        <label class="flex items-center gap-1.5 text-sm cursor-pointer" style="color: var(--color-text);">
          <input v-model="isInteger" type="radio" :value="true" class="rounded-full" />
          整数
        </label>
        <label class="flex items-center gap-1.5 text-sm cursor-pointer" style="color: var(--color-text);">
          <input v-model="isInteger" type="radio" :value="false" class="rounded-full" />
          小数
        </label>
      </div>
    </div>

    <ErrorAlert :message="error" />

    <div class="flex justify-start">
      <button
        @click="generate"
        class="btn-primary"
      >
        生成
      </button>
    </div>

    <div v-if="result !== null" class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <div class="flex items-center justify-between">
        <span class="text-2xl font-mono font-bold" style="color: var(--color-primary);">{{ displayResult }}</span>
        <CopyButton :text="displayResult" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const minValue = ref(1);
const maxValue = ref(100);
const isInteger = ref(true);
const result = ref<number | null>(null);
const error = ref('');

const displayResult = computed(() => {
  if (result.value === null) return '';
  return isInteger.value ? result.value.toString() : result.value.toFixed(4);
});

function generate() {
  error.value = '';
  if (minValue.value >= maxValue.value) {
    error.value = '最小值必须小于最大值';
    return;
  }

  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const random = array[0] / 0xFFFFFFFF;
  const range = maxValue.value - minValue.value;

  if (isInteger.value) {
    result.value = Math.floor(random * (range + 1)) + minValue.value;
  } else {
    result.value = random * range + minValue.value;
  }
}
</script>
