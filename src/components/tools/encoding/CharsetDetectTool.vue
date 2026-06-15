<template>
  <div class="space-y-4">
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium" style="color: var(--color-text-primary);">输入文本</span>
        <span class="text-xs" style="color: var(--color-text-muted);">（支持粘贴或直接输入）</span>
      </div>
      <textarea
        v-model="input"
        class="input w-full"
        rows="6"
        placeholder="请输入要检测字符集的文本..."
        spellcheck="false"
      ></textarea>
      <div class="flex justify-end">
        <button @click="detect" class="btn-primary">
          检测字符集
        </button>
      </div>
    </div>

    <div v-if="results.length > 0" class="space-y-3">
      <div class="text-sm font-medium" style="color: var(--color-text-primary);">检测结果</div>

      <div class="rounded-md border p-3 space-y-2" style="border-color: var(--color-border); background: var(--color-bg-secondary);">
        <div
          v-for="(r, idx) in results"
          :key="idx"
          class="flex items-center justify-between py-1.5"
          :class="{ 'border-b': idx < results.length - 1 }"
          style="border-color: var(--color-border);"
        >
          <div class="flex items-center gap-3">
            <span
              class="inline-flex items-center justify-center rounded-full w-7 h-7 text-xs font-bold"
              :style="{
                background: idx === 0 ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                color: idx === 0 ? '#fff' : 'var(--color-text-secondary)',
              }"
            >
              {{ idx + 1 }}
            </span>
            <span class="text-sm font-medium" style="color: var(--color-text-primary);">{{ r.charset }}</span>
            <span class="text-xs px-1.5 py-0.5 rounded" style="background: var(--color-bg-tertiary); color: var(--color-text-secondary);">{{ r.confidence }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-28 h-1.5 rounded-full overflow-hidden" style="background: var(--color-bg-tertiary);">
              <div
                class="h-full rounded-full transition-all"
                :style="{ width: r.score + '%', background: idx === 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }"
              ></div>
            </div>
            <span class="text-xs w-10 text-right" style="color: var(--color-text-secondary);">{{ r.score }}%</span>
          </div>
        </div>
      </div>

      <div v-if="details" class="rounded-md border p-3 space-y-2" style="border-color: var(--color-border); background: var(--color-bg-secondary);">
        <div class="text-xs font-medium" style="color: var(--color-text-primary);">检测详情</div>
        <div class="text-xs space-y-1" style="color: var(--color-text-secondary);">
          <div>BOM: {{ details.bom || '无' }}</div>
          <div>含 CJK 字符: {{ details.hasCJK ? '是' : '否' }}</div>
          <div>ASCII 占比: {{ details.asciiRatio }}%</div>
          <div>空字节模式: {{ details.nullBytePattern || '无' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface DetectResult {
  charset: string;
  score: number;
  confidence: string;
}

interface DetectDetails {
  bom: string;
  hasCJK: boolean;
  asciiRatio: string;
  nullBytePattern: string;
}

const input = ref('');
const results = ref<DetectResult[]>([]);
const details = ref<DetectDetails | null>(null);

function detect() {
  const text = input.value;
  if (!text.trim()) {
    results.value = [];
    details.value = null;
    return;
  }

  const bytes = new TextEncoder().encode(text);
  const arr = Array.from(bytes);
  const len = arr.length;

  // Detect BOM
  let bom = '无';
  if (arr[0] === 0xEF && arr[1] === 0xBB && arr[2] === 0xBF) bom = 'UTF-8 BOM';
  else if (arr[0] === 0xFE && arr[1] === 0xFF) bom = 'UTF-16 BE BOM';
  else if (arr[0] === 0xFF && arr[1] === 0xFE) bom = 'UTF-16 LE BOM';

  // ASCII ratio
  let asciiCount = 0;
  let cjkCount = 0;
  let nullByteCount = 0;
  let highByteCount = 0;

  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code < 128) asciiCount++;
    if ((code >= 0x4E00 && code <= 0x9FFF) ||
        (code >= 0x3400 && code <= 0x4DBF) ||
        (code >= 0xF900 && code <= 0xFAFF)) {
      cjkCount++;
    }
    if (code === 0) nullByteCount++;
    if (code > 127) highByteCount++;
  }

  // Null byte pattern
  let nullBytePattern = '无';
  if (nullByteCount > 0 && nullByteCount > text.length * 0.3) {
    // Check alternating pattern
    let alternating = true;
    for (let i = 0; i + 1 < arr.length; i += 2) {
      if (arr[i] !== 0 && arr[i + 1] !== 0) {
        alternating = false;
        break;
      }
    }
    if (alternating) {
      nullBytePattern = arr[0] === 0 ? 'UTF-16 BE (每隔一个字节为零)' : 'UTF-16 LE (每隔一个字节为零)';
    } else {
      nullBytePattern = '含较多空字节';
    }
  }

  const asciiRatio = text.length > 0 ? Math.round((asciiCount / text.length) * 100) : 0;

  // Build results
  const scores: DetectResult[] = [];

  // UTF-8 detection
  let utf8Score = 50;
  if (bom === 'UTF-8 BOM') utf8Score = 95;
  // Check valid UTF-8 multi-byte sequences
  let validUtf8 = true;
  const rawBytes = new TextEncoder().encode(text);
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(rawBytes);
    utf8Score += 30;
  } catch {
    utf8Score -= 30;
    validUtf8 = false;
  }
  if (asciiRatio === 100) utf8Score = 90;
  if (validUtf8 && cjkCount > 0) utf8Score = Math.min(utf8Score, 85);
  scores.push({ charset: 'UTF-8', score: Math.min(utf8Score, 100), confidence: utf8Score >= 80 ? '高' : utf8Score >= 50 ? '中' : '低' });

  // ASCII detection
  if (asciiRatio === 100) {
    scores.push({ charset: 'ASCII', score: 100, confidence: '高' });
  } else if (asciiRatio >= 90) {
    scores.push({ charset: 'ASCII', score: 85, confidence: '中' });
  }

  // UTF-16 detection
  if (bom === 'UTF-16 BE BOM') {
    scores.push({ charset: 'UTF-16 BE', score: 95, confidence: '高' });
  } else if (bom === 'UTF-16 LE BOM') {
    scores.push({ charset: 'UTF-16 LE', score: 95, confidence: '高' });
  }
  if (nullBytePattern.includes('UTF-16')) {
    scores.push({ charset: nullBytePattern.includes('BE') ? 'UTF-16 BE' : 'UTF-16 LE', score: 70, confidence: '中' });
  }

  // GBK detection (CJK)
  if (cjkCount > 0 && !validUtf8) {
    const gbkScore = 60 + Math.min(cjkCount * 2, 30);
    scores.push({ charset: 'GBK / GB2312', score: gbkScore, confidence: gbkScore >= 70 ? '中' : '低' });
  }

  // Big5 detection (traditional Chinese heuristic)
  if (cjkCount > 0 && !validUtf8) {
    scores.push({ charset: 'Big5', score: 40, confidence: '低' });
  }

  // ISO-8859-1 detection
  if (highByteCount > 0 && !validUtf8 && cjkCount === 0) {
    scores.push({ charset: 'ISO-8859-1 (Latin-1)', score: 55, confidence: '中' });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Filter to top results and remove duplicates
  const seen = new Set<string>();
  const filtered: DetectResult[] = [];
  for (const s of scores) {
    if (!seen.has(s.charset) && filtered.length < 5) {
      seen.add(s.charset);
      filtered.push(s);
    }
  }

  results.value = filtered;
  details.value = {
    bom,
    hasCJK: cjkCount > 0,
    asciiRatio: String(asciiRatio),
    nullBytePattern,
  };
}
</script>
