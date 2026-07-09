<template>
  <div class="space-y-4">
    <!-- 两个颜色输入 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="rounded-md border p-3" style="border-color: var(--color-border);">
        <label class="text-xs font-medium block mb-2" style="color: var(--color-text-secondary);">文字颜色（前景）</label>
        <div class="flex items-center gap-3">
          <input
            type="color"
            v-model="fg.hex"
            class="w-12 h-12 rounded-md border cursor-pointer p-0.5"
            style="border-color: var(--color-border);"
            @input="syncFgFromHex"
          />
          <div class="flex-1 space-y-1.5">
            <div class="flex gap-2">
              <input
                v-model="fg.hex"
                type="text"
                placeholder="#FFFFFF"
                class="flex-1 rounded-md border px-3 py-1.5 text-sm font-mono focus:outline-none"
                style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
                @input="syncFgFromHex"
              />
              <CopyButton :text="fg.hex" />
            </div>
            <div class="text-xs font-mono" style="color: var(--color-text-muted);">RGB({{ fg.rgb }})</div>
          </div>
        </div>
      </div>

      <div class="rounded-md border p-3" style="border-color: var(--color-border);">
        <label class="text-xs font-medium block mb-2" style="color: var(--color-text-secondary);">背景颜色</label>
        <div class="flex items-center gap-3">
          <input
            type="color"
            v-model="bg.hex"
            class="w-12 h-12 rounded-md border cursor-pointer p-0.5"
            style="border-color: var(--color-border);"
            @input="syncBgFromHex"
          />
          <div class="flex-1 space-y-1.5">
            <div class="flex gap-2">
              <input
                v-model="bg.hex"
                type="text"
                placeholder="#000000"
                class="flex-1 rounded-md border px-3 py-1.5 text-sm font-mono focus:outline-none"
                style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
                @input="syncBgFromHex"
              />
              <CopyButton :text="bg.hex" />
            </div>
            <div class="text-xs font-mono" style="color: var(--color-text-muted);">RGB({{ bg.rgb }})</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm" style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- 实时预览 -->
    <div
      class="rounded-md border p-5 flex flex-col items-center justify-center text-center gap-2 min-h-[90px]"
      :style="'background-color: ' + bg.hex + '; border-color: ' + bg.hex + ';'"
    >
      <div class="text-2xl font-bold leading-tight" :style="'color: ' + fg.hex + ';'">对比度预览 Aa 文字示例</div>
      <div class="text-sm" :style="'color: ' + fg.hex + ';'">一段用于检查可读性的示例文本，正常字号与加粗大字号混合展示。</div>
      <div class="text-lg font-bold" :style="'color: ' + fg.hex + ';'">大号加粗文字（Large Text）</div>
    </div>

    <!-- 对比度比值 -->
    <div class="rounded-md border p-4 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <div class="text-xs mb-1" style="color: var(--color-text-secondary);">WCAG 对比度比值</div>
      <div class="text-3xl font-extrabold font-mono" style="color: var(--color-text);">{{ ratio.toFixed(2) }}<span class="text-xl">:1</span></div>
      <div class="text-xs mt-1" style="color: var(--color-text-muted);">相对亮度 — 前景 {{ fgLum.toFixed(3) }} / 背景 {{ bgLum.toFixed(3) }}</div>
    </div>

    <!-- 达标判定 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div
        v-for="rule in rules"
        :key="rule.label"
        class="rounded-md border px-3 py-2.5 flex items-center justify-between"
        :style="rule.pass
          ? 'border-color: #86efac; background-color: #f0fdf4;'
          : 'border-color: #fecaca; background-color: #fef2f2;'"
      >
        <div>
          <div class="text-sm font-medium" style="color: var(--color-text);">{{ rule.label }}</div>
          <div class="text-xs" style="color: var(--color-text-muted);">要求 ≥ {{ rule.min }}:1</div>
        </div>
        <span
          class="text-xs font-bold px-2 py-1 rounded"
          :style="rule.pass ? 'background-color: #16a34a; color: #fff;' : 'background-color: #dc2626; color: #fff;'"
        >{{ rule.pass ? '通过 ✓' : '不达标 ✗' }}</span>
      </div>
    </div>

    <!-- 一键达标建议 -->
    <div class="rounded-md border p-3" style="border-color: var(--color-border);">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="text-sm" style="color: var(--color-text-secondary);">
          若未达标，可自动调整 <b style="color: var(--color-text);">{{ adjustTargetLabel }}</b> 以达到：
        </div>
        <div class="flex items-center gap-2">
          <select v-model="targetLevel" class="rounded-md border px-2 py-1.5 text-sm" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);">
            <option value="4.5">AA 普通文本 (4.5)</option>
            <option value="3">AA 大文本 / 非文本 (3.0)</option>
            <option value="7">AAA 普通文本 (7.0)</option>
          </select>
          <button
            class="text-sm font-medium px-3 py-1.5 rounded-md text-white"
            style="background-color: var(--color-primary);"
            @click="autoFix"
          >自动调整</button>
        </div>
      </div>
      <p v-if="fixNote" class="text-xs mt-2" style="color: var(--color-text-muted);">{{ fixNote }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

interface ColorState {
  hex: string;
  rgb: string;
}

const fg = reactive<ColorState>({ hex: '#FFFFFF', rgb: '255, 255, 255' });
const bg = reactive<ColorState>({ hex: '#1F2937', rgb: '31, 41, 55' });
const error = ref('');
const targetLevel = ref('4.5');
const fixNote = ref('');

const adjustTargetLabel = computed(() => (fgLum.value >= bgLum.value ? '背景' : '前景'));

function hexToRgb(hex: string): [number, number, number] | null {
  const cleaned = hex.replace('#', '').trim();
  let h = cleaned;
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => {
    const hex = Math.max(0, Math.min(255, Math.round(v))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

function parseAndApply(state: ColorState, fromHex: boolean) {
  error.value = '';
  if (fromHex) {
    const rgb = hexToRgb(state.hex);
    if (!rgb) {
      error.value = '无效的 HEX 颜色值，请使用 #RGB 或 #RRGGBB 格式';
      return;
    }
    state.rgb = rgb.join(', ');
  } else {
    const parts = state.rgb.split(',').map(v => parseInt(v.trim(), 10));
    if (parts.length !== 3 || parts.some(v => isNaN(v) || v < 0 || v > 255)) {
      error.value = '无效的 RGB 颜色值，请使用格式: 255, 255, 255';
      return;
    }
    state.hex = rgbToHex(parts[0], parts[1], parts[2]);
  }
}

function syncFgFromHex() { parseAndApply(fg, true); }
function syncBgFromHex() { parseAndApply(bg, true); }

// 相对亮度（WCAG 2.1）
function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(c => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const fgRgb = computed(() => hexToRgb(fg.hex) || [255, 255, 255]);
const bgRgb = computed(() => hexToRgb(bg.hex) || [0, 0, 0]);
const fgLum = computed(() => relativeLuminance(fgRgb.value));
const bgLum = computed(() => relativeLuminance(bgRgb.value));

const ratio = computed(() => {
  const l1 = Math.max(fgLum.value, bgLum.value);
  const l2 = Math.min(fgLum.value, bgLum.value);
  return (l1 + 0.05) / (l2 + 0.05);
});

const rules = computed(() => [
  { label: 'WCAG AA 普通文本', min: 4.5, pass: ratio.value >= 4.5 },
  { label: 'WCAG AA 大文本', min: 3.0, pass: ratio.value >= 3.0 },
  { label: 'WCAG AAA 普通文本', min: 7.0, pass: ratio.value >= 7.0 },
  { label: 'WCAG AAA 大文本', min: 4.5, pass: ratio.value >= 4.5 },
  { label: 'WCAG 2.1 非文本对比', min: 3.0, pass: ratio.value >= 3.0 },
  { label: 'WCAG 2.0 普通文本', min: 4.5, pass: ratio.value >= 4.5 },
]);

// 自动调整较暗/较亮的一方，使其满足目标对比度，尽量保留色相与饱和度
function autoFix() {
  fixNote.value = '';
  const target = parseFloat(targetLevel.value);
  const fixedIsFg = fgLum.value < bgLum.value; // 调整较暗的一方
  const fixed = fixedIsFg ? fg : bg;
  const otherRgb = (fixedIsFg ? bgRgb : fgRgb).value;

  const rgb = hexToRgb(fixed.hex);
  if (!rgb) { error.value = '当前颜色无效，无法自动调整'; return; }
  const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);

  // 朝更暗或更亮方向二分搜索亮度，使对比度达标
  const otherLum = relativeLuminance(otherRgb);
  const goDarker = otherLum > 0.5; // 对方更亮，则把当前色往暗调
  let lo = 0, hi = 100;
  let best = -1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    const testRgb = hslToRgb(hsl[0], hsl[1], mid);
    const lum = relativeLuminance(testRgb);
    const r = (Math.max(lum, otherLum) + 0.05) / (Math.min(lum, otherLum) + 0.05);
    if (r >= target) { best = mid; if (goDarker) hi = mid; else lo = mid; }
    else { if (goDarker) lo = mid; else hi = mid; }
  }
  if (best < 0) {
    fixNote.value = '在当前色相/饱和度下无法达到目标对比度，请尝试更换另一方颜色。';
    return;
  }
  const resultRgb = hslToRgb(hsl[0], hsl[1], best);
  fixed.hex = rgbToHex(resultRgb[0], resultRgb[1], resultRgb[2]);
  fixed.rgb = resultRgb.join(', ');
  fixNote.value = `已将${fixedIsFg ? '前景' : '背景'}调整为 HEX ${fixed.hex}，对比度约 ${(ratio.value).toFixed(2)}:1，已达标。`;
}
</script>
