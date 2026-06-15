<template>
  <div class="space-y-4">
    <TabView :tabs="['文字水印', '图片水印']">
      <!-- Tab 0: 文字水印 -->
      <template #tab-0>
        <div class="space-y-4">
          <div
            class="rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer"
            :style="isDragging
              ? 'border-color: var(--color-primary); background-color: var(--color-bg-tertiary);'
              : 'border-color: var(--color-border); background-color: var(--color-bg-secondary);'"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
            @click="triggerFileInput"
          >
            <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onFileSelect" />
            <svg class="mx-auto mb-2" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--color-text-muted);">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p class="text-sm" style="color: var(--color-text-secondary);">拖拽图片到此处或点击选择</p>
          </div>

          <div v-if="originalUrl" class="rounded-md border p-3" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
            <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">原图</p>
            <img :src="originalUrl" class="max-w-full max-h-48 object-contain rounded" />
          </div>

          <div v-if="originalUrl" class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">水印文字</label>
              <input
                v-model="watermarkText"
                type="text"
                placeholder="例如: © 2024 My Company"
                class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">字体大小</label>
              <input
                v-model.number="fontSize"
                type="number"
                min="8"
                max="200"
                class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">颜色</label>
              <div class="flex items-center gap-2">
                <input v-model="fontColor" type="color" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                <input
                  v-model="fontColor"
                  type="text"
                  class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">透明度: {{ opacity }}%</label>
              <input v-model.number="opacity" type="range" min="10" max="100" class="w-full" />
            </div>
            <div>
              <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">位置</label>
              <select v-model="position" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none">
                <option value="center">居中</option>
                <option value="bottom-right">右下角</option>
                <option value="bottom-left">左下角</option>
                <option value="top-right">右上角</option>
                <option value="top-left">左上角</option>
                <option value="tiled">平铺</option>
              </select>
            </div>
            <div class="flex items-end">
              <button @click="applyTextWatermark" :disabled="!watermarkText.trim()" class="btn-primary w-full">
                应用水印
              </button>
            </div>
          </div>

          <div v-if="resultUrl" class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
            <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">水印预览</p>
            <img :src="resultUrl" class="max-w-full max-h-64 object-contain rounded" />
            <div class="flex justify-end mt-3">
              <button @click="downloadResult" class="btn-primary">
                下载图片
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Tab 1: 图片水印 -->
      <template #tab-1>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">原图</p>
              <div
                class="rounded-lg border-2 border-dashed p-4 text-center transition-colors cursor-pointer"
                :style="isDragging2
                  ? 'border-color: var(--color-primary); background-color: var(--color-bg-tertiary);'
                  : 'border-color: var(--color-border); background-color: var(--color-bg-secondary);'"
                @dragover.prevent="isDragging2 = true"
                @dragleave.prevent="isDragging2 = false"
                @drop.prevent="onDrop2"
                @click="triggerFileInput2"
              >
                <input ref="fileInputRef2" type="file" accept="image/*" class="hidden" @change="onFileSelect2" />
                <p class="text-xs" style="color: var(--color-text-muted);">点击添加图片</p>
              </div>
              <img v-if="baseUrl" :src="baseUrl" class="max-w-full max-h-32 object-contain mt-2 rounded" />
            </div>
            <div>
              <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">水印图片</p>
              <div
                class="rounded-lg border-2 border-dashed p-4 text-center transition-colors cursor-pointer"
                :style="isDragging3
                  ? 'border-color: var(--color-primary); background-color: var(--color-bg-tertiary);'
                  : 'border-color: var(--color-border); background-color: var(--color-bg-secondary);'"
                @dragover.prevent="isDragging3 = true"
                @dragleave.prevent="isDragging3 = false"
                @drop.prevent="onDrop3"
                @click="triggerFileInput3"
              >
                <input ref="fileInputRef3" type="file" accept="image/*" class="hidden" @change="onFileSelect3" />
                <p class="text-xs" style="color: var(--color-text-muted);">点击添加水印</p>
              </div>
              <img v-if="overlayUrl" :src="overlayUrl" class="max-w-full max-h-32 object-contain mt-2 rounded" />
            </div>
          </div>

          <div v-if="baseUrl && overlayUrl" class="space-y-3">
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">位置</label>
                <select v-model="overlayPosition" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none">
                  <option value="center">居中</option>
                  <option value="bottom-right">右下角</option>
                  <option value="bottom-left">左下角</option>
                  <option value="top-right">右上角</option>
                  <option value="top-left">左上角</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">缩放比例: {{ overlayScale }}%</label>
                <input v-model.number="overlayScale" type="range" min="10" max="200" class="w-full" />
              </div>
              <div>
                <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">透明度: {{ overlayOpacity }}%</label>
                <input v-model.number="overlayOpacity" type="range" min="10" max="100" class="w-full" />
              </div>
            </div>

            <div class="flex justify-end">
              <button @click="applyImageWatermark" class="btn-primary">应用水印</button>
            </div>
          </div>

          <div v-if="resultUrl" class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
            <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">水印预览</p>
            <img :src="resultUrl" class="max-w-full max-h-64 object-contain rounded" />
            <div class="flex justify-end mt-3">
              <button @click="downloadResult" class="btn-primary">下载图片</button>
            </div>
          </div>
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TabView from '../../common/TabView.vue';

// Text watermark state
const fileInputRef = ref<HTMLInputElement>();
const isDragging = ref(false);
const originalUrl = ref('');
const resultUrl = ref('');
const watermarkText = ref('© 2024');
const fontSize = ref(36);
const fontColor = ref('#ffffff');
const opacity = ref(50);
const position = ref('bottom-right');
let baseImage: HTMLImageElement | null = null;

// Image watermark state
const fileInputRef2 = ref<HTMLInputElement>();
const fileInputRef3 = ref<HTMLInputElement>();
const isDragging2 = ref(false);
const isDragging3 = ref(false);
const baseUrl = ref('');
const overlayUrl = ref('');
const overlayPosition = ref('bottom-right');
const overlayScale = ref(50);
const overlayOpacity = ref(70);
let baseImg: HTMLImageElement | null = null;
let overlayImg: HTMLImageElement | null = null;

// --- Text watermark ---
function triggerFileInput() { fileInputRef.value?.click(); }
function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files?.[0]) loadBase(input.files[0]);
}
function onDrop(e: DragEvent) { isDragging.value = false; const f = e.dataTransfer?.files?.[0]; if (f) loadBase(f); }

function loadBase(file: File) {
  resultUrl.value = '';
  const reader = new FileReader();
  reader.onload = () => {
    baseImage = new Image();
    baseImage.onload = () => { originalUrl.value = reader.result as string; };
    baseImage.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function getPositionXY(ctxW: number, ctxH: number, textW: number, textH: number, pos: string): { x: number; y: number } {
  const pad = 20;
  switch (pos) {
    case 'center': return { x: (ctxW - textW) / 2, y: (ctxH - textH) / 2 };
    case 'bottom-right': return { x: ctxW - textW - pad, y: ctxH - pad };
    case 'bottom-left': return { x: pad, y: ctxH - pad };
    case 'top-right': return { x: ctxW - textW - pad, y: pad + textH };
    case 'top-left': return { x: pad, y: pad + textH };
    default: return { x: ctxW - textW - pad, y: ctxH - pad };
  }
}

function applyTextWatermark() {
  if (!baseImage) return;
  const canvas = document.createElement('canvas');
  canvas.width = baseImage.naturalWidth;
  canvas.height = baseImage.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(baseImage, 0, 0);
  ctx.font = `${fontSize.value}px sans-serif`;
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = fontColor.value;
  ctx.globalAlpha = opacity.value / 100;

  const text = watermarkText.value;
  const metrics = ctx.measureText(text);
  const textW = metrics.width;
  const textH = fontSize.value;

  if (position.value === 'tiled') {
    ctx.textBaseline = 'middle';
    const spacing = fontSize.value * 6;
    for (let y = 0; y < canvas.height + textH; y += spacing) {
      for (let x = 0; x < canvas.width + textW; x += spacing) {
        ctx.fillText(text, x, y);
      }
    }
  } else {
    const pos = getPositionXY(canvas.width, canvas.height, textW, textH, position.value);
    ctx.fillText(text, pos.x, pos.y);
  }

  resultUrl.value = canvas.toDataURL('image/png');
}

// --- Image watermark ---
function triggerFileInput2() { fileInputRef2.value?.click(); }
function triggerFileInput3() { fileInputRef3.value?.click(); }
function onFileSelect2(e: Event) { const input = e.target as HTMLInputElement; if (input.files?.[0]) loadBase2(input.files[0]); }
function onFileSelect3(e: Event) { const input = e.target as HTMLInputElement; if (input.files?.[0]) loadOverlay(input.files[0]); }
function onDrop2(e: DragEvent) { isDragging2.value = false; const f = e.dataTransfer?.files?.[0]; if (f) loadBase2(f); }
function onDrop3(e: DragEvent) { isDragging3.value = false; const f = e.dataTransfer?.files?.[0]; if (f) loadOverlay(f); }

function loadBase2(file: File) {
  resultUrl.value = '';
  const reader = new FileReader();
  reader.onload = () => {
    baseImg = new Image();
    baseImg.onload = () => { baseUrl.value = reader.result as string; };
    baseImg.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function loadOverlay(file: File) {
  resultUrl.value = '';
  const reader = new FileReader();
  reader.onload = () => {
    overlayImg = new Image();
    overlayImg.onload = () => { overlayUrl.value = reader.result as string; };
    overlayImg.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function applyImageWatermark() {
  if (!baseImg || !overlayImg) return;
  const canvas = document.createElement('canvas');
  canvas.width = baseImg.naturalWidth;
  canvas.height = baseImg.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(baseImg, 0, 0);
  ctx.globalAlpha = overlayOpacity.value / 100;
  const scale = overlayScale.value / 100;
  const ow = overlayImg.naturalWidth * scale;
  const oh = overlayImg.naturalHeight * scale;
  const pad = 20;

  let x: number, y: number;
  switch (overlayPosition.value) {
    case 'center': x = (canvas.width - ow) / 2; y = (canvas.height - oh) / 2; break;
    case 'bottom-right': x = canvas.width - ow - pad; y = canvas.height - oh - pad; break;
    case 'bottom-left': x = pad; y = canvas.height - oh - pad; break;
    case 'top-right': x = canvas.width - ow - pad; y = pad; break;
    case 'top-left': x = pad; y = pad; break;
    default: x = canvas.width - ow - pad; y = canvas.height - oh - pad;
  }

  ctx.drawImage(overlayImg, x, y, ow, oh);
  resultUrl.value = canvas.toDataURL('image/png');
}

function downloadResult() {
  if (!resultUrl.value) return;
  const a = document.createElement('a');
  a.href = resultUrl.value;
  a.download = 'watermarked_image.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
</script>
