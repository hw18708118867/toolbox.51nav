<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">X 偏移: {{ offsetX }}px</label>
        <input
          type="range"
          v-model.number="offsetX"
          min="-50"
          max="50"
          class="w-full"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">Y 偏移: {{ offsetY }}px</label>
        <input
          type="range"
          v-model.number="offsetY"
          min="-50"
          max="50"
          class="w-full"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">模糊: {{ blur }}px</label>
        <input
          type="range"
          v-model.number="blur"
          min="0"
          max="100"
          class="w-full"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">扩展: {{ spread }}px</label>
        <input
          type="range"
          v-model.number="spread"
          min="-50"
          max="50"
          class="w-full"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">阴影颜色</label>
        <div class="flex items-center gap-3">
          <input
            type="color"
            v-model="shadowColor"
            class="w-10 h-10 rounded-md border cursor-pointer"
            style="border-color: var(--color-border);"
          />
          <input
            v-model="shadowColor"
            type="text"
            class="flex-1 rounded-md border px-3 py-2 text-sm font-mono focus:outline-none "
            
          />
        </div>
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">透明度: {{ (opacity / 100).toFixed(2) }}</label>
        <input
          type="range"
          v-model.number="opacity"
          min="0"
          max="100"
          class="w-full"
        />
      </div>
    </div>

    <div>
      <label class="flex items-center gap-2 text-xs font-medium cursor-pointer" style="color: var(--color-text-secondary);">
        <input type="checkbox" v-model="inset" class="rounded" />
        内阴影 (inset)
      </label>
    </div>

    <div>
      <label class="text-xs font-medium block mb-2" style="color: var(--color-text-secondary);">实时预览</label>
      <div
        class="w-full h-32 rounded-lg border flex items-center justify-center"
        style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
      >
        <div
          class="w-32 h-20 rounded-lg"
          :style="'background-color: var(--color-bg); border-color: var(--color-border); box-shadow: ' + shadowValue + ';'"
        ></div>
      </div>
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

const offsetX = ref(5);
const offsetY = ref(5);
const blur = ref(10);
const spread = ref(0);
const shadowColor = ref('#000000');
const opacity = ref(30);
const inset = ref(false);

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  let r: number, g: number, b: number;
  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  }
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const shadowValue = computed(() => {
  const insetStr = inset.value ? 'inset ' : '';
  const rgba = hexToRgba(shadowColor.value, opacity.value / 100);
  return `${insetStr}${offsetX.value}px ${offsetY.value}px ${blur.value}px ${spread.value}px ${rgba}`;
});

const cssCode = computed(() => {
  return `box-shadow: ${shadowValue.value};`;
});
</script>
