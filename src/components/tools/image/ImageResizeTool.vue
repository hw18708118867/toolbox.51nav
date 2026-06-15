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
      <p class="text-xs" style="color: var(--color-text-muted);">支持 PNG, JPEG, WebP, GIF, BMP</p>
    </div>

    <div v-if="originalFile" class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <div class="flex items-center gap-3 mb-3">
        <img :src="originalPreview" class="w-16 h-16 object-cover rounded-md border" style="border-color: var(--color-border);" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate" style="color: var(--color-text);">{{ originalFile.name }}</p>
          <p class="text-xs" style="color: var(--color-text-muted);">原始尺寸: {{ originalWidth }} x {{ originalHeight }} px | {{ formatSize(originalFile.size) }}</p>
        </div>
        <button @click="removeFile" class="text-xs px-2 py-1 rounded-md border" style="color: var(--color-text-muted); border-color: var(--color-border);">
          移除
        </button>
      </div>
    </div>

    <div v-if="originalFile" class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">宽度 (px)</label>
        <input
          v-model.number="targetWidth"
          type="number"
          min="1"
          max="10000"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
          @input="onWidthChange"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">高度 (px)</label>
        <input
          v-model.number="targetHeight"
          type="number"
          min="1"
          max="10000"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
          @input="onHeightChange"
        />
      </div>
    </div>

    <div v-if="originalFile" class="flex items-center gap-3">
      <label class="flex items-center gap-1.5 text-sm cursor-pointer" style="color: var(--color-text-secondary);">
        <input v-model="maintainAspectRatio" type="checkbox" class="rounded" />
        保持宽高比
      </label>
    </div>

    <div v-if="originalFile" class="flex justify-end gap-2">
      <button
        @click="resizeAndDownload"
        :disabled="resizing"
        class="btn-primary"
      >
        {{ resizing ? '处理中...' : '缩放并下载' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const fileInputRef = ref<HTMLInputElement>();
const isDragging = ref(false);
const originalFile = ref<File | null>(null);
const originalPreview = ref('');
const originalWidth = ref(0);
const originalHeight = ref(0);
const targetWidth = ref(0);
const targetHeight = ref(0);
const maintainAspectRatio = ref(true);
const resizing = ref(false);
const aspectRatio = ref(1);

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

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
  originalFile.value = file;
  const reader = new FileReader();
  reader.onload = () => {
    originalPreview.value = reader.result as string;
    const img = new Image();
    img.onload = () => {
      originalWidth.value = img.naturalWidth;
      originalHeight.value = img.naturalHeight;
      targetWidth.value = img.naturalWidth;
      targetHeight.value = img.naturalHeight;
      aspectRatio.value = img.naturalWidth / img.naturalHeight;
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function removeFile() {
  originalFile.value = null;
  originalPreview.value = '';
  originalWidth.value = 0;
  originalHeight.value = 0;
}

function onWidthChange() {
  if (maintainAspectRatio.value && aspectRatio.value > 0) {
    targetHeight.value = Math.round(targetWidth.value / aspectRatio.value);
  }
}

function onHeightChange() {
  if (maintainAspectRatio.value && aspectRatio.value > 0) {
    targetWidth.value = Math.round(targetHeight.value * aspectRatio.value);
  }
}

function resizeAndDownload() {
  if (!originalFile.value) return;
  resizing.value = true;

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth.value;
    canvas.height = targetHeight.value;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resizing.value = false;
      return;
    }
    ctx.drawImage(img, 0, 0, targetWidth.value, targetHeight.value);

    const mimeType = originalFile.value!.type || 'image/png';
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const ext = mimeType.split('/')[1] || 'png';
        const filename = originalFile.value!.name.replace(/\.[^.]+$/, '') + '_resized.' + ext;
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      resizing.value = false;
    }, mimeType);
  };
  img.onerror = () => {
    resizing.value = false;
  };
  img.src = originalPreview.value;
}
</script>
