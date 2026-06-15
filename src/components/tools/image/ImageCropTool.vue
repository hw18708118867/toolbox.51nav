<template>
  <div class="space-y-4">
    <div
      class="rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer"
      :style="isDragging
        ? 'border-color: var(--color-primary); background-color: var(--color-bg-tertiary);'
        : 'border-color: var(--color-border); background-color: var(--color-bg-secondary);'"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileSelect"
      />
      <svg class="mx-auto mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--color-text-muted);">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <p class="text-sm mb-1" style="color: var(--color-text-secondary);">拖拽图片到此处或点击选择</p>
      <p class="text-xs" style="color: var(--color-text-muted);">支持 PNG, JPEG, WebP</p>
    </div>

    <ErrorAlert :message="error" />

    <div v-if="imageLoaded" class="space-y-4">
      <div class="text-xs font-medium" style="color: var(--color-text-secondary);">
        在图片上拖拽选择裁剪区域
      </div>

      <div
        class="relative inline-block"
        style="max-width: 100%; overflow: auto;"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
      >
        <canvas
          ref="canvasRef"
          class="block"
          :style="{ cursor: cropping ? 'crosshair' : 'default' }"
        />
        <div
          v-if="cropRect"
          class="absolute border-2 pointer-events-none"
          :style="{
            left: cropRect.x + 'px',
            top: cropRect.y + 'px',
            width: cropRect.w + 'px',
            height: cropRect.h + 'px',
            borderColor: 'var(--color-primary)',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
          }"
        />
      </div>

      <div class="flex items-center gap-2">
        <button @click="resetCrop" class="px-3 py-1.5 rounded-md border text-xs" style="color: var(--color-text-secondary); border-color: var(--color-border);">
          重置裁剪区
        </button>
        <button @click="doCrop" :disabled="!cropRect" class="btn-primary">
          裁剪
        </button>
      </div>

      <div v-if="croppedUrl" class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
        <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">裁剪预览</p>
        <img :src="croppedUrl" class="max-w-full h-auto rounded-md border" style="border-color: var(--color-border);" />
        <div class="flex justify-end mt-3">
          <button @click="downloadCrop" class="btn-primary">
            下载裁剪结果
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const fileInputRef = ref<HTMLInputElement>();
const canvasRef = ref<HTMLCanvasElement>();
const isDragging = ref(false);
const imageLoaded = ref(false);
const error = ref('');

const cropRect = ref<{ x: number; y: number; w: number; h: number } | null>(null);
const croppedUrl = ref('');

let img: HTMLImageElement | null = null;
let isCropping = false;
let cropStart = { x: 0, y: 0 };

function triggerFileInput() {
  fileInputRef.value?.click();
}

function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    loadFile(input.files[0]);
  }
}

function onDrop(event: DragEvent) {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) loadFile(file);
}

function loadFile(file: File) {
  error.value = '';
  croppedUrl.value = '';
  cropRect.value = null;
  imageLoaded.value = false;

  const reader = new FileReader();
  reader.onload = () => {
    img = new Image();
    img.onload = () => {
      if (!canvasRef.value) return;
      const canvas = canvasRef.value;
      const maxW = 800;
      const maxH = 600;
      let w = img!.naturalWidth;
      let h = img!.naturalHeight;
      if (w > maxW) { h = Math.round(h * (maxW / w)); w = maxW; }
      if (h > maxH) { w = Math.round(w * (maxH / h)); h = maxH; }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img!, 0, 0, w, h);
      }
      imageLoaded.value = true;
    };
    img.onerror = () => {
      error.value = '图片加载失败，请重试。';
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function getCanvasPos(e: MouseEvent): { x: number; y: number } {
  const rect = canvasRef.value!.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function onMouseDown(e: MouseEvent) {
  if (!imageLoaded.value) return;
  const pos = getCanvasPos(e);
  cropStart = pos;
  cropRect.value = { x: pos.x, y: pos.y, w: 0, h: 0 };
  isCropping = true;
}

function onMouseMove(e: MouseEvent) {
  if (!isCropping || !cropRect.value) return;
  const pos = getCanvasPos(e);
  const w = canvasRef.value!.width;
  const h = canvasRef.value!.height;
  let x = Math.max(0, Math.min(cropStart.x, pos.x));
  let y = Math.max(0, Math.min(cropStart.y, pos.y));
  let rw = Math.min(w - x, Math.abs(pos.x - cropStart.x));
  let rh = Math.min(h - y, Math.abs(pos.y - cropStart.y));
  cropRect.value = { x, y, w: rw, h: rh };
}

function onMouseUp() {
  if (isCropping && cropRect.value && (cropRect.value.w < 5 || cropRect.value.h < 5)) {
    cropRect.value = null;
  }
  isCropping = false;
}

function resetCrop() {
  cropRect.value = null;
  croppedUrl.value = '';
}

function doCrop() {
  if (!cropRect.value || !canvasRef.value || !img) return;
  const canvas = document.createElement('canvas');
  canvas.width = cropRect.value.w;
  canvas.height = cropRect.value.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const scaleX = img.naturalWidth / canvasRef.value.width;
  const scaleY = img.naturalHeight / canvasRef.value.height;
  ctx.drawImage(
    img,
    cropRect.value.x * scaleX,
    cropRect.value.y * scaleY,
    cropRect.value.w * scaleX,
    cropRect.value.h * scaleY,
    0, 0,
    cropRect.value.w,
    cropRect.value.h,
  );
  croppedUrl.value = canvas.toDataURL('image/png');
}

function downloadCrop() {
  if (!croppedUrl.value) return;
  const a = document.createElement('a');
  a.href = croppedUrl.value;
  a.download = 'cropped_image.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
</script>
