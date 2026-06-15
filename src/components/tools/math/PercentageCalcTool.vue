<template>
  <div class="space-y-4">
    <TabView :tabs="['X 的 Y%', 'X 是 Y 的 %', '百分比变化']">
      <template #tab-0>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">数值 X</label>
              <input
                v-model.number="xValue"
                type="number"
                class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
                
              />
            </div>
            <div>
              <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">百分比 Y (%)</label>
              <input
                v-model.number="yPercent"
                type="number"
                class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
                
              />
            </div>
          </div>
          <div v-if="pctResult !== null" class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <span class="text-sm" style="color: var(--color-text);">
              {{ xValue }} 的 {{ yPercent }}% = <strong style="color: var(--color-primary);">{{ pctResult }}</strong>
            </span>
          </div>
        </div>
      </template>

      <template #tab-1>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">数值 X</label>
              <input
                v-model.number="xValue2"
                type="number"
                class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
                
              />
            </div>
            <div>
              <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">数值 Y</label>
              <input
                v-model.number="yValue2"
                type="number"
                class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
                
              />
            </div>
          </div>
          <div v-if="ratioResult !== null" class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <span class="text-sm" style="color: var(--color-text);">
              {{ xValue2 }} 是 {{ yValue2 }} 的 <strong style="color: var(--color-primary);">{{ ratioResult }}%</strong>
            </span>
          </div>
        </div>
      </template>

      <template #tab-2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">原值 A</label>
              <input
                v-model.number="valueA"
                type="number"
                class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
                
              />
            </div>
            <div>
              <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">新值 B</label>
              <input
                v-model.number="valueB"
                type="number"
                class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
                
              />
            </div>
          </div>
          <div v-if="changeResult !== null" class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <span class="text-sm" style="color: var(--color-text);">
              从 {{ valueA }} 变为 {{ valueB }}，变化幅度: <strong style="color: var(--color-primary);">{{ changeResult >= 0 ? '+' : '' }}{{ changeResult }}%</strong>
            </span>
          </div>
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TabView from '../../common/TabView.vue';

// Tab 0
const xValue = ref(0);
const yPercent = ref(0);
const pctResult = computed(() => {
  if (xValue.value && yPercent.value !== undefined) {
    return (xValue.value * yPercent.value / 100).toFixed(2);
  }
  return null;
});

// Tab 1
const xValue2 = ref(0);
const yValue2 = ref(0);
const ratioResult = computed(() => {
  if (xValue2.value && yValue2.value) {
    return ((xValue2.value / yValue2.value) * 100).toFixed(2);
  }
  return null;
});

// Tab 2
const valueA = ref(0);
const valueB = ref(0);
const changeResult = computed(() => {
  if (valueA.value && valueA.value !== 0) {
    return (((valueB.value - valueA.value) / valueA.value) * 100).toFixed(2);
  }
  return null;
});
</script>
