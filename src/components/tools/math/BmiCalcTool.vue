<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">身高 (cm)</label>
        <input
          v-model.number="height"
          type="number"
          min="1"
          placeholder="例如: 170"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">体重 (kg)</label>
        <input
          v-model.number="weight"
          type="number"
          min="1"
          placeholder="例如: 65"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        />
      </div>
    </div>

    <div v-if="bmiValue > 0" class="rounded-md border p-5 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <div class="text-4xl font-bold mb-2" :style="{ color: categoryColor }">{{ bmiValue.toFixed(1) }}</div>
      <div class="text-lg font-medium" :style="{ color: categoryColor }">{{ categoryLabel }}</div>
      <div class="text-xs mt-3" style="color: var(--color-text-muted);">
        正常范围: 18.5 - 23.9
      </div>
      <div class="mt-3 w-full h-2 rounded-full overflow-hidden flex" style="background-color: var(--color-bg-tertiary);">
        <div class="h-full" style="width: 25%; background-color: #3498db;"></div>
        <div class="h-full" style="width: 25%; background-color: #2ecc71;"></div>
        <div class="h-full" style="width: 25%; background-color: #f39c12;"></div>
        <div class="h-full" style="width: 25%; background-color: #e74c3c;"></div>
        <div class="h-full w-0.5" style="background-color: var(--color-text); margin-left: -0.5px; transform: translateX(calc(var(--color-text)));"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const height = ref(170);
const weight = ref(65);

const bmiValue = computed(() => {
  if (!height.value || !weight.value || height.value <= 0 || weight.value <= 0) return 0;
  const h = height.value / 100;
  return weight.value / (h * h);
});

const categoryLabel = computed(() => {
  const bmi = bmiValue.value;
  if (bmi <= 0) return '';
  if (bmi < 18.5) return '偏瘦';
  if (bmi < 24) return '正常';
  if (bmi < 28) return '偏胖';
  return '肥胖';
});

const categoryColor = computed(() => {
  const bmi = bmiValue.value;
  if (bmi <= 0) return 'var(--color-text)';
  if (bmi < 18.5) return '#3498db';
  if (bmi < 24) return '#2ecc71';
  if (bmi < 28) return '#f39c12';
  return '#e74c3c';
});
</script>
