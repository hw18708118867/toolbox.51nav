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
      <input ref="fileInputRef" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" class="hidden" @change="onFileSelect" />
      <svg class="mx-auto mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--color-text-muted);">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <p class="text-sm mb-1" style="color: var(--color-text-secondary);">拖拽图片到此处或点击选择</p>
      <p class="text-xs" style="color: var(--color-text-muted);">支持 PNG, JPEG, WebP — 将生成多分辨率 .ico 文件</p>
    </div>

    <div v-if="originalUrl" class="rounded-md border p-3" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">原图预览</p>
      <img :src="originalUrl" class="max-w-full max-h-48 object-contain rounded" />
    </div>

    <div v-if="originalUrl" class="space-y-3">
      <p class="text-xs font-medium" style="color: var(--color-text-secondary);">选择要包含的图标尺寸</p>
      <div class="grid grid-cols-4 gap-2">
        <label v-for="size in availableSizes" :key="size" class="flex items-center gap-1.5 text-sm cursor-pointer" style="color: var(--color-text);">
          <input
            v-model="selectedSizes"
            :value="size"
            type="checkbox"
            class="rounded"
            style="accent-color: var(--color-primary);"
          />
          {{ size }}x{{ size }}
        </label>
      </div>

      <div class="flex justify-end">
        <button @click="generateIco" :disabled="selectedSizes.length === 0" class="btn-primary">
          生成 ICO 文件
        </button>
      </div>
    </div>

    <ErrorAlert :message="error" />

    <div v-if="icoBlob" class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <div class="flex items-center gap-3 mb-3">
        <div>
          <p class="text-sm font-medium" style="color: var(--color-text);">ICO 文件已生成</p>
          <p class="text-xs" style="color: var(--color-text-muted);">
            包含 {{ selectedSizes.length }} 个尺寸: {{ selectedSizes.join('x, ') }}x
            — 文件大小: {{ formatSize(icoBlob.size) }}
          </p>
        </div>
      </div>

      <div v-if="generatedSizes.length > 0" class="mb-3">
        <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">各尺寸预览</p>
        <div class="flex flex-wrap gap-3">
          <div v-for="(preview, idx) in generatedSizes" :key="idx" class="text-center">
            <div class="rounded border inline-block p-1" style="border-color: var(--color-border); background-color: var(--color-bg-tertiary);">
              <img :src="preview.dataUrl" :width="preview.size" :height="preview.size" class="block" />
            </div>
            <p class="text-xs mt-1" style="color: var(--color-text-muted);">{{ preview.size }}x{{ preview.size }}</p>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <button @click="downloadIco" class="btn-primary">下载 .ico 文件</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const fileInputRef = ref<HTMLInputElement>();
const isDragging = ref(false);
const originalUrl = ref('');
const error = ref('');
const icoBlob = ref<Blob | null>(null);

const availableSizes = [16, 24, 32, 48, 64, 128, 256];
const selectedSizes = ref<number[]>([16, 32, 48, 256]);

const generatedSizes = ref<{ size: number; dataUrl: string }[]>([]);

let sourceImage: HTMLImageElement | null = null;

function triggerFileInput() { fileInputRef.value?.click(); }

function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) loadFile(input.files[0]);
}

function onDrop(event: DragEvent) {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) loadFile(file);
}

function loadFile(file: File) {
  error.value = '';
  icoBlob.value = null;
  generatedSizes.value = [];
  const reader = new FileReader();
  reader.onload = () => {
    sourceImage = new Image();
    sourceImage.onload = () => { originalUrl.value = reader.result as string; };
    sourceImage.onerror = () => { error.value = '图片加载失败，请重试。'; };
    sourceImage.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function resizeToPng(size: number): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    if (!sourceImage) return reject(new Error('No image'));
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas not supported'));
    ctx.drawImage(sourceImage, 0, 0, size, size);
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(new Error('Failed to create blob'));
      const buf = await blob.arrayBuffer();
      resolve(buf);
    }, 'image/png');
  });
}

async function generateIco() {
  error.value = '';
  icoBlob.value = null;
  generatedSizes.value = [];

  if (!sourceImage) return;
  if (selectedSizes.value.length === 0) {
    error.value = '请至少选择一个尺寸';
    return;
  }

  try {
    const sizes = [...selectedSizes.value].sort((a, b) => a - b);
    const pngBuffers: ArrayBuffer[] = [];
    const previews: { size: number; dataUrl: string }[] = [];

    for (const size of sizes) {
      const buf = await resizeToPng(size);
      pngBuffers.push(buf);

      // Create preview
      const blob = new Blob([buf], { type: 'image/png' });
      previews.push({ size, dataUrl: URL.createObjectURL(blob) });
    }
    generatedSizes.value = previews;

    // Build ICO file
    const headerSize = 6;
    const entrySize = 16;
    const entriesSize = sizes.length * entrySize;
    const dataOffset = headerSize + entriesSize;

    // Calculate total size
    let totalSize = dataOffset;
    for (const buf of pngBuffers) {
      totalSize += buf.byteLength;
    }

    const icoBuffer = new ArrayBuffer(totalSize);
    const dv = new DataView(icoBuffer);

    // ICO header
    dv.setUint16(0, 0, true);      // Reserved
    dv.setUint16(2, 1, true);      // Type: 1 = ICO
    dv.setUint16(4, sizes.length, true); // Count

    // Write entries
    let currentOffset = dataOffset;
    for (let i = 0; i < sizes.length; i++) {
      const s = sizes[i];
      const entryOff = headerSize + i * entrySize;
      dv.setUint8(entryOff, s >= 256 ? 0 : s);  // Width (0 = 256)
      dv.setUint8(entryOff + 1, s >= 256 ? 0 : s); // Height (0 = 256)
      dv.setUint8(entryOff + 2, 0);  // Colors
      dv.setUint8(entryOff + 3, 0);  // Reserved
      dv.setUint16(entryOff + 4, 1, true); // Planes
      dv.setUint16(entryOff + 6, 32, true); // BPP
      dv.setUint32(entryOff + 8, pngBuffers[i].byteLength, true); // Size
      dv.setUint32(entryOff + 12, currentOffset, true); // Offset
      currentOffset += pngBuffers[i].byteLength;
    }

    // Write PNG data
    currentOffset = dataOffset;
    for (let i = 0; i < pngBuffers.length; i++) {
      const srcView = new Uint8Array(pngBuffers[i]);
      const dstView = new Uint8Array(icoBuffer, currentOffset, srcView.length);
      dstView.set(srcView);
      currentOffset += pngBuffers[i].byteLength;
    }

    icoBlob.value = new Blob([icoBuffer], { type: 'image/x-icon' });
  } catch (e: any) {
    error.value = '生成 ICO 失败: ' + e.message;
  }
}

function downloadIco() {
  if (!icoBlob.value) return;
  const url = URL.createObjectURL(icoBlob.value);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'favicon.ico';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>
