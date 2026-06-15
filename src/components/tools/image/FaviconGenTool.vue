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
      <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onFileSelect" />
      <svg class="mx-auto mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--color-text-muted);">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <p class="text-sm mb-1" style="color: var(--color-text-secondary);">拖拽图片到此处或点击选择</p>
      <p class="text-xs" style="color: var(--color-text-muted);">支持 PNG, JPEG, WebP — 生成全套 favicon 文件</p>
    </div>

    <div v-if="originalUrl" class="rounded-md border p-3" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">原图预览</p>
      <img :src="originalUrl" class="max-w-full max-h-48 object-contain rounded" />
    </div>

    <ErrorAlert :message="error" />

    <div v-if="originalUrl" class="space-y-3">
      <div class="flex justify-end">
        <button @click="generateAll" :disabled="generating" class="btn-primary">
          {{ generating ? '生成中...' : '生成全部 Favicon 文件' }}
        </button>
      </div>
    </div>

    <div v-if="faviconFiles.length > 0" class="space-y-4">
      <!-- Preview grid -->
      <div>
        <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">各尺寸预览</p>
        <div class="flex flex-wrap gap-4 items-end">
          <div v-for="item in faviconFiles" :key="item.label" class="text-center">
            <div class="rounded border inline-block p-1" style="border-color: var(--color-border); background-color: var(--color-bg-tertiary);">
              <img :src="item.dataUrl" :width="item.previewSize || item.size" :height="item.previewSize || item.size" class="block" />
            </div>
            <p class="text-xs mt-1" style="color: var(--color-text-muted);">{{ item.label }}</p>
            <p class="text-xs" style="color: var(--color-text-muted);">{{ item.size }}x{{ item.size }}</p>
          </div>
        </div>
      </div>

      <!-- File list and download buttons -->
      <div class="rounded-md border" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
        <div class="p-3 border-b" style="border-color: var(--color-border);">
          <p class="text-xs font-medium" style="color: var(--color-text-secondary);">生成的文件</p>
        </div>
        <div v-for="item in faviconFiles" :key="item.filename" class="flex items-center justify-between px-3 py-2 border-b last:border-b-0" style="border-color: var(--color-border);">
          <div class="flex items-center gap-2">
            <span class="text-sm font-mono" style="color: var(--color-text);">{{ item.filename }}</span>
            <span class="text-xs" style="color: var(--color-text-muted);">{{ item.size }}x{{ item.size }}</span>
          </div>
          <button @click="downloadFile(item)" class="text-xs px-2 py-1 rounded border" style="color: var(--color-primary); border-color: var(--color-border);">
            下载
          </button>
        </div>
      </div>

      <!-- site.webmanifest code -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-medium" style="color: var(--color-text-secondary);">site.webmanifest</label>
        </div>
        <textarea
          :value="webmanifestCode"
          readonly
          :rows="10"
          class="w-full rounded-xl px-4 py-3 text-sm resize-y font-mono"
          style="background-color: var(--color-bg-secondary); border: 1px solid var(--color-border); color: var(--color-text);"
        />
        <div class="flex justify-end gap-2 mt-2">
          <button @click="copyManifest" class="text-xs px-2 py-1 rounded border" style="color: var(--color-text-muted); border-color: var(--color-border);">
            复制
          </button>
          <button @click="downloadManifest" class="btn-primary text-xs">
            下载 webmanifest
          </button>
        </div>
      </div>

      <!-- HTML snippet -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-medium" style="color: var(--color-text-secondary);">HTML &lt;head&gt; 代码片段</label>
        </div>
        <textarea
          :value="htmlSnippet()"
          readonly
          :rows="8"
          class="w-full rounded-xl px-4 py-3 text-sm resize-y font-mono"
          style="background-color: var(--color-bg-secondary); border: 1px solid var(--color-border); color: var(--color-text);"
        />
        <div class="flex justify-end mt-2">
          <button @click="copyHtmlSnippet" class="text-xs px-2 py-1 rounded border" style="color: var(--color-text-muted); border-color: var(--color-border);">
            复制
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
const isDragging = ref(false);
const originalUrl = ref('');
const error = ref('');
const generating = ref(false);

interface FaviconItem {
  label: string;
  filename: string;
  size: number;
  previewSize?: number;
  dataUrl: string;
  blob: Blob;
}

const faviconFiles = ref<FaviconItem[]>([]);
const webmanifestCode = ref('');

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
  faviconFiles.value = [];
  webmanifestCode.value = '';
  const reader = new FileReader();
  reader.onload = () => {
    sourceImage = new Image();
    sourceImage.onload = () => { originalUrl.value = reader.result as string; };
    sourceImage.onerror = () => { error.value = '图片加载失败，请重试。'; };
    sourceImage.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function resizeToBlob(size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!sourceImage) return reject(new Error('No image'));
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas not supported'));
    ctx.drawImage(sourceImage, 0, 0, size, size);
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Failed to create blob'));
      resolve(blob);
    }, 'image/png');
  });
}

async function generateAll() {
  error.value = '';
  faviconFiles.value = [];
  webmanifestCode.value = '';

  if (!sourceImage) return;

  generating.value = true;
  try {
    const specs = [
      { label: 'favicon.ico', filename: 'favicon.ico', size: 48 },
      { label: 'favicon-16x16', filename: 'favicon-16x16.png', size: 16 },
      { label: 'favicon-32x32', filename: 'favicon-32x32.png', size: 32 },
      { label: 'android-chrome-192', filename: 'android-chrome-192x192.png', size: 192, previewSize: 96 },
      { label: 'android-chrome-512', filename: 'android-chrome-512x512.png', size: 512, previewSize: 96 },
      { label: 'apple-touch-icon', filename: 'apple-touch-icon.png', size: 180, previewSize: 90 },
    ];

    const results: FaviconItem[] = [];

    for (const spec of specs) {
      let blob: Blob;
      if (spec.filename === 'favicon.ico') {
        blob = await createIcoBlob(48);
      } else {
        blob = await resizeToBlob(spec.size);
      }
      const dataUrl = URL.createObjectURL(blob);
      results.push({ ...spec, dataUrl, blob, previewSize: spec.previewSize ?? Math.min(spec.size, 64) });
    }

    faviconFiles.value = results;

    // Generate webmanifest
    webmanifestCode.value = JSON.stringify({
      name: '',
      short_name: '',
      icons: [
        { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
    }, null, 2);
  } catch (e: any) {
    error.value = '生成失败: ' + e.message;
  } finally {
    generating.value = false;
  }
}

async function createIcoBlob(size: number): Promise<Blob> {
  const pngBlob = await resizeToBlob(size);
  const pngBuf = await pngBlob.arrayBuffer();

  const headerSize = 6;
  const entrySize = 16;
  const dataOffset = headerSize + entrySize;
  const totalSize = dataOffset + pngBuf.byteLength;

  const buf = new ArrayBuffer(totalSize);
  const dv = new DataView(buf);

  dv.setUint16(0, 0, true);    // Reserved
  dv.setUint16(2, 1, true);    // Type: ICO
  dv.setUint16(4, 1, true);    // Count: 1

  const w = size >= 256 ? 0 : size;
  dv.setUint8(6, w);           // Width
  dv.setUint8(7, w);           // Height
  dv.setUint8(8, 0);           // Colors
  dv.setUint8(9, 0);           // Reserved
  dv.setUint16(10, 1, true);   // Planes
  dv.setUint16(12, 32, true);  // BPP
  dv.setUint32(14, pngBuf.byteLength, true);  // Size
  dv.setUint32(18, dataOffset, true);         // Offset

  const dst = new Uint8Array(buf, dataOffset, pngBuf.byteLength);
  dst.set(new Uint8Array(pngBuf));

  return new Blob([buf], { type: 'image/x-icon' });
}

function downloadFile(item: FaviconItem) {
  const url = URL.createObjectURL(item.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = item.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadManifest() {
  const blob = new Blob([webmanifestCode.value], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'site.webmanifest';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function htmlSnippet(): string {
  return `<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />`;
}

async function copyManifest() {
  try { await navigator.clipboard.writeText(webmanifestCode.value); } catch {
    const ta = document.createElement('textarea');
    ta.value = webmanifestCode.value;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

async function copyHtmlSnippet() {
  const text = htmlSnippet();
  try { await navigator.clipboard.writeText(text); } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}
</script>
