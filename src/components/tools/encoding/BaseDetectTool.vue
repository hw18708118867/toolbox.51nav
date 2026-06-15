<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入疑似编码的文本..." :rows="4" show-count />

    <div class="flex justify-end">
      <button
        @click="detect"
        :disabled="!input.trim()"
        class="btn-primary"
      >
        检测
      </button>
    </div>

    <div v-if="results.length > 0" class="space-y-2">
      <div class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">编码可能性分析</div>
      <div
        v-for="r in results"
        :key="r.name"
        class="flex items-center gap-3 rounded-md border p-3"
        style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
      >
        <div class="w-24 text-sm font-medium" style="color: var(--color-text);">{{ r.name }}</div>
        <div class="flex-1 h-4 rounded-full overflow-hidden" style="background-color: var(--color-bg-tertiary);">
          <div
            class="h-full rounded-full transition-all"
            :style="{ width: r.score + '%', backgroundColor: getScoreColor(r.score) }"
          ></div>
        </div>
        <div class="w-12 text-right text-sm font-mono" style="color: var(--color-text-secondary);">{{ r.score }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';

const input = ref('');

interface DetectResult {
  name: string;
  score: number;
}

const results = ref<DetectResult[]>([]);

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#6b7280';
}

function detect() {
  const text = input.value.trim();
  const res: DetectResult[] = [];

  // Base64 detection
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (base64Regex.test(text) && text.length % 4 === 0 && text.length >= 4) {
    const score = Math.min(100, 40 + (text.length >= 8 ? 30 : 0) + (text.endsWith('=') ? 20 : 0));
    if (score >= 50) res.push({ name: 'Base64', score });
  }

  // Hex detection
  const hexRegex = /^[0-9A-Fa-f]+$/;
  if (hexRegex.test(text) && text.length >= 4 && text.length % 2 === 0) {
    const score = Math.min(100, 30 + (text.length >= 8 ? 20 : 0));
    res.push({ name: 'HEX', score });
  }

  // URL encoding detection
  if (/%[0-9A-Fa-f]{2}/.test(text)) {
    const matchCount = (text.match(/%[0-9A-Fa-f]{2}/g) || []).length;
    const score = Math.min(100, Math.round((matchCount / text.length) * 200));
    if (score >= 40) res.push({ name: 'URL 编码', score });
  }

  // Binary detection
  if (/^[01]+$/.test(text) && text.length >= 8 && text.length % 8 === 0) {
    res.push({ name: '二进制', score: 70 });
  }

  // JWT detection
  if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(text)) {
    res.push({ name: 'JWT Token', score: 95 });
  }

  // ASCII text
  if (/^[\x20-\x7E\r\n\t]+$/.test(text)) {
    res.push({ name: '纯文本 (ASCII)', score: 85 });
  }

  results.value = res.sort((a, b) => b.score - a.score);
}
</script>
