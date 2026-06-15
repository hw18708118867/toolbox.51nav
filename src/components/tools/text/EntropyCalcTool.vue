<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要计算熵值的文本..." :rows="6" show-count />

    <div class="flex justify-end">
      <button
        @click="calculate"
        :disabled="!input.trim()"
        class="btn-primary"
      >
        计算
      </button>
    </div>

    <div v-if="entropy !== null" class="rounded-md border p-5 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <div class="text-3xl font-bold mb-2" :style="{ color: interpretationColor }">{{ entropy.toFixed(4) }}</div>
      <div class="text-sm" style="color: var(--color-text-secondary);">香农熵 (Shannon Entropy)</div>
      <div class="text-sm mt-2 font-medium" :style="{ color: interpretationColor }">{{ interpretation }}</div>
      <div class="text-xs mt-3" style="color: var(--color-text-muted);">
        熵值范围 0-8，越高表示随机性越强
      </div>
      <div class="mt-2 w-full h-2 rounded-full overflow-hidden" style="background-color: var(--color-bg-tertiary);">
        <div
          class="h-full rounded-full transition-all"
          :style="{ width: (entropy / 8 * 100) + '%', backgroundColor: interpretationColor }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TextInput from '../../common/TextInput.vue';

const input = ref('');
const entropy = ref<number | null>(null);

const interpretation = computed(() => {
  if (entropy.value === null) return '';
  if (entropy.value < 2) return '极低 - 高度重复/可预测';
  if (entropy.value < 4) return '较低 - 有一定规律';
  if (entropy.value < 6) return '中等 - 较为随机';
  if (entropy.value < 7.5) return '较高 - 随机性强';
  return '极高 - 近乎完全随机';
});

const interpretationColor = computed(() => {
  if (entropy.value === null) return 'var(--color-text)';
  if (entropy.value < 3) return '#ef4444';
  if (entropy.value < 5) return '#f59e0b';
  if (entropy.value < 7) return '#3b82f6';
  return '#22c55e';
});

function calculate() {
  const text = input.value;
  const freq: Record<string, number> = {};
  for (const ch of text) {
    freq[ch] = (freq[ch] || 0) + 1;
  }

  const len = text.length;
  let ent = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    ent -= p * Math.log2(p);
  }
  entropy.value = ent;
}
</script>
