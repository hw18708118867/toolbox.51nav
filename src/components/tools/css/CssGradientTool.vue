<template>
  <div class="space-y-4">
    <div>
      <label class="text-xs font-medium block mb-2" style="color: var(--color-text-secondary);">渐变类型</label>
      <div class="flex gap-2">
        <button
          v-for="type in gradientTypes"
          :key="type.value"
          @click="gradientType = type.value"
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors border"
          :style="gradientType === type.value
            ? 'background-color: var(--color-primary); color: white; border-color: var(--color-primary);'
            : 'background-color: var(--color-bg-secondary); color: var(--color-text); border-color: var(--color-border);'"
        >
          {{ type.label }}
        </button>
      </div>
    </div>

    <div v-if="gradientType === 'linear'">
      <label class="text-xs font-medium block mb-2" style="color: var(--color-text-secondary);">角度: {{ angle }}deg</label>
      <input
        type="range"
        v-model.number="angle"
        min="0"
        max="360"
        class="w-full"
      />
    </div>

    <div>
      <label class="text-xs font-medium block mb-2" style="color: var(--color-text-secondary);">颜色色标</label>
      <div class="space-y-3">
        <div
          v-for="(stop, index) in colorStops"
          :key="index"
          class="flex items-center gap-3 rounded-md border p-3"
          style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
        >
          <input
            type="color"
            v-model="stop.color"
            class="w-10 h-10 rounded-md border cursor-pointer"
            style="border-color: var(--color-border);"
          />
          <div class="flex-1">
            <input
              v-model="stop.color"
              type="text"
              class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none "
              
            />
          </div>
          <div class="w-20">
            <input
              v-model.number="stop.position"
              type="number"
              min="0"
              max="100"
              class="w-full rounded-md border px-2 py-2 text-sm text-center focus:outline-none "
              
            />
            <div class="text-xs text-center mt-0.5" style="color: var(--color-text-muted);">%</div>
          </div>
          <button
            v-if="colorStops.length > 2"
            @click="removeStop(index)"
            class="text-xs px-2 py-1 rounded-md border"
            style="color: var(--color-text-muted); border-color: var(--color-border);"
          >
            删除
          </button>
        </div>
      </div>

      <button
        v-if="colorStops.length < 4"
        @click="addStop"
        class="mt-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border"
        style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary); border-color: var(--color-border);"
      >
        + 添加色标
      </button>
    </div>

    <div>
      <label class="text-xs font-medium block mb-2" style="color: var(--color-text-secondary);">预览</label>
      <div
        class="w-full h-32 rounded-lg border"
        :style="'border-color: var(--color-border); ' + previewGradient"
      ></div>
    </div>

    <div>
      <div class="flex items-center justify-between mb-1.5">
        <label class="text-xs font-medium" style="color: var(--color-text-secondary);">CSS 代码</label>
        <CopyButton :text="cssCode" />
      </div>
      <pre
        class="w-full rounded-md border px-3 py-2 text-sm font-mono overflow-x-auto"
        style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text);"
      >{{ cssCode }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

interface ColorStop {
  color: string;
  position: number;
}

const gradientTypes = [
  { label: '线性渐变', value: 'linear' },
  { label: '径向渐变', value: 'radial' },
];

const gradientType = ref('linear');
const angle = ref(90);
const colorStops = ref<ColorStop[]>([
  { color: '#FF5733', position: 0 },
  { color: '#3355FF', position: 100 },
]);

function addStop() {
  colorStops.value.push({ color: '#33FF57', position: 50 });
  // Re-distribute positions evenly
  const n = colorStops.value.length;
  colorStops.value.forEach((stop, i) => {
    stop.position = Math.round((i / (n - 1)) * 100);
  });
}

function removeStop(index: number) {
  if (colorStops.value.length <= 2) return;
  colorStops.value.splice(index, 1);
}

const previewGradient = computed(() => {
  if (gradientType.value === 'linear') {
    return `background-image: linear-gradient(${angle.value}deg, ${colorStopsString.value});`;
  }
  return `background-image: radial-gradient(circle, ${colorStopsString.value});`;
});

const colorStopsString = computed(() => {
  const sorted = [...colorStops.value].sort((a, b) => a.position - b.position);
  return sorted.map(s => `${s.color} ${s.position}%`).join(', ');
});

const cssCode = computed(() => {
  if (gradientType.value === 'linear') {
    return `background: linear-gradient(${angle.value}deg, ${colorStopsString.value});`;
  }
  return `background: radial-gradient(circle, ${colorStopsString.value});`;
});
</script>
