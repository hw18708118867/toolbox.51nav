<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要分析的文本..." :rows="6" show-count />

    <div class="flex justify-end">
      <button
        @click="analyze"
        :disabled="!input.trim()"
        class="btn-primary"
      >
        分析
      </button>
    </div>

    <div v-if="analysis.length > 0" class="space-y-2">
      <div class="text-xs font-medium" style="color: var(--color-text-secondary);">字符频率 Top 10</div>
      <div v-for="(item, index) in analysis.slice(0, 10)" :key="index" class="flex items-center gap-3">
        <div class="w-16 text-right">
          <span class="text-sm font-mono" style="color: var(--color-text);">{{ item.char }}</span>
        </div>
        <div class="flex-1 h-5 rounded-full overflow-hidden" style="background-color: var(--color-bg-tertiary);">
          <div
            class="h-full rounded-full transition-all"
            :style="{ width: item.percent + '%', backgroundColor: getBarColor(index) }"
          ></div>
        </div>
        <div class="w-16 text-right">
          <span class="text-xs font-mono" style="color: var(--color-text-muted);">{{ item.count }} ({{ item.percent }}%)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';

const input = ref('');

interface FreqItem {
  char: string;
  count: number;
  percent: number;
}

const analysis = ref<FreqItem[]>([]);

const barColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#F0B27A', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'];

function getBarColor(index: number): string {
  return barColors[index % barColors.length];
}

function analyze() {
  const freq: Record<string, number> = {};
  let total = 0;
  for (const ch of input.value) {
    freq[ch] = (freq[ch] || 0) + 1;
    total++;
  }

  const items: FreqItem[] = Object.entries(freq)
    .map(([char, count]) => ({
      char: char === ' ' ? '(空格)' : char === '\n' ? '(换行)' : char === '\t' ? '(Tab)' : char,
      count,
      percent: total > 0 ? +((count / total) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  analysis.value = items;
}
</script>
