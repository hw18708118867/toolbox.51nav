<template>
  <div class="space-y-4">
    <div class="flex gap-4 items-start">
      <div class="flex flex-col items-center gap-2">
        <input
          type="color"
          v-model="hexInput"
          class="w-16 h-16 rounded-md border cursor-pointer"
          style="border-color: var(--color-border);"
        />
        <div
          class="w-16 h-8 rounded-md border"
          :style="'background-color: ' + hexInput + '; border-color: var(--color-border);'"
        />
      </div>
      <div class="flex-1 space-y-3">
        <div>
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">HEX</label>
          <div class="flex gap-2">
            <input
              v-model="hexInput"
              type="text"
              placeholder="#FF5733"
              class="flex-1 rounded-md border px-3 py-2 text-sm font-mono focus:outline-none "
              
              @input="onHexInput"
            />
            <CopyButton :text="hexInput" />
          </div>
        </div>
        <div>
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">RGB</label>
          <div class="flex gap-2">
            <input
              v-model="rgbInput"
              type="text"
              placeholder="255, 87, 51"
              class="flex-1 rounded-md border px-3 py-2 text-sm font-mono focus:outline-none "
              
              @input="onRgbInput"
            />
            <CopyButton :text="'rgb(' + rgbInput + ')'" />
          </div>
        </div>
        <div>
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">HSL</label>
          <div class="flex gap-2">
            <input
              v-model="hslInput"
              type="text"
              placeholder="11, 100%, 60%"
              class="flex-1 rounded-md border px-3 py-2 text-sm font-mono focus:outline-none "
              
              @input="onHslInput"
            />
            <CopyButton :text="'hsl(' + hslInput + ')'" />
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

    <div class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
      <table class="w-full text-sm">
        <tbody>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary); width: 120px;">HEX</td>
            <td class="px-4 py-2.5 font-mono" style="color: var(--color-text);">{{ hexInput }} <CopyButton :text="hexInput" /></td>
          </tr>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">RGB</td>
            <td class="px-4 py-2.5 font-mono" style="color: var(--color-text);">rgb({{ rgbInput }}) <CopyButton :text="'rgb(' + rgbInput + ')'" /></td>
          </tr>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">HSL</td>
            <td class="px-4 py-2.5 font-mono" style="color: var(--color-text);">hsl({{ hslInput }}) <CopyButton :text="'hsl(' + hslInput + ')'" /></td>
          </tr>
          <tr>
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">CSS</td>
            <td class="px-4 py-2.5 font-mono" style="color: var(--color-text);">color: {{ hexInput }}; <CopyButton :text="'color: ' + hexInput + ';'" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const hexInput = ref('#FF5733');
const rgbInput = ref('255, 87, 51');
const hslInput = ref('11, 100%, 60%');
const error = ref('');

function hexToRgb(hex: string): [number, number, number] | null {
  const cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return [r, g, b];
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return [r, g, b];
  }
  return null;
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
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255),
  ];
}

function onHexInput() {
  error.value = '';
  const rgb = hexToRgb(hexInput.value);
  if (!rgb) {
    error.value = '无效的 HEX 颜色值';
    return;
  }
  rgbInput.value = rgb.join(', ');
  const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  hslInput.value = hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%';
}

function onRgbInput() {
  error.value = '';
  const parts = rgbInput.value.split(',').map(v => parseInt(v.trim(), 10));
  if (parts.length !== 3 || parts.some(v => isNaN(v) || v < 0 || v > 255)) {
    error.value = '无效的 RGB 颜色值，请使用格式: 255, 87, 51';
    return;
  }
  hexInput.value = rgbToHex(parts[0], parts[1], parts[2]);
  const hsl = rgbToHsl(parts[0], parts[1], parts[2]);
  hslInput.value = hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%';
}

function onHslInput() {
  error.value = '';
  const match = hslInput.value.match(/^(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?$/);
  if (!match) {
    error.value = '无效的 HSL 颜色值，请使用格式: 11, 100%, 60%';
    return;
  }
  const h = parseInt(match[1], 10);
  const s = parseInt(match[2], 10);
  const l = parseInt(match[3], 10);
  if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) {
    error.value = 'HSL 值超出范围';
    return;
  }
  const rgb = hslToRgb(h, s, l);
  hexInput.value = rgbToHex(rgb[0], rgb[1], rgb[2]);
  rgbInput.value = rgb.join(', ');
}
</script>
