<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <button
        @click="triggerFileInput"
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors border"
        style="background-color: var(--color-bg-secondary); color: var(--color-text); border-color: var(--color-border);"
      >
        选择图片
      </button>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileSelect"
      />
      <span v-if="originalFile" class="text-sm" style="color: var(--color-text-muted);">
        {{ originalFile.name }}
      </span>
      <span v-else class="text-sm" style="color: var(--color-text-muted);">
        未选择文件
      </span>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">目标格式</label>
        <select
          v-model="targetFormat"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        >
          <option value="image/png">PNG</option>
          <option value="image/jpeg">JPEG</option>
          <option value="image/webp">WebP</option>
          <option value="image/bmp">BMP</option>
        </select>
      </div>
      <div v-if="targetFormat === 'image/jpeg' || targetFormat === 'image/webp'">
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">
          质量: {{ quality }}%
        </label>
        <input
          type="range"
          v-model.number="quality"
          min="10"
          max="100"
          class="w-full"
        />
      </div>
      <div v-else>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-muted);">
          质量（仅 JPEG/WebP）
        </label>
        <input
          type="range"
          disabled
          :value="100"
          class="w-full opacity-40"
        />
      </div>
    </div>

    <div class="flex justify-end">
      <button
        @click="convert"
        :disabled="!originalFile || converting"
        class="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        {{ converting ? '转换中...' : '转换并下载' }}
      </button>
    </div>

    <div v-if="originalFile" class="grid grid-cols-2 gap-4">
      <div>
        <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">原图预览</p>
        <div class="rounded-lg border overflow-hidden" style="border-color: var(--color-border); background-color: var(--color-bg-tertiary);">
          <img :src="originalPreview" class="w-full h-48 object-contain" />
        </div>
        <p class="text-xs mt-1" style="color: var(--color-text-muted);">
          {{ formatSize(originalFile.size) }} · {{ originalFile.type || '未知格式' }}
        </p>
      </div>
      <div>
        <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">转换后预览</p>
        <div class="rounded-lg border overflow-hidden" style="border-color: var(--color-border); background-color: var(--color-bg-tertiary);">
          <img v-if="convertedPreview" :src="convertedPreview" class="w-full h-48 object-contain" />
          <div v-else class="flex items-center justify-center h-48">
            <span class="text-sm" style="color: var(--color-text-muted);">点击转换后显示预览</span>
          </div>
        </div>
        <p v-if="convertedBlob" class="text-xs mt-1" style="color: var(--color-text-muted);">
          {{ formatSize(convertedBlob.size) }} · {{ targetFormat }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const fileInputRef = ref<HTMLInputElement>();
const originalFile = ref<File | null>(null);
const originalPreview = ref('');
const convertedBlob = ref<Blob | null>(null);
const convertedPreview = ref('');
const converting = ref(false);
const targetFormat = ref('image/png');
const quality = ref(80);

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

function loadFile(file: File) {
  convertedBlob.value = null;
  convertedPreview.value = '';
  originalFile.value = file;
  const reader = new FileReader();
  reader.onload = () => {
    originalPreview.value = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function convert() {
  if (!originalFile.value) return;
  converting.value = true;

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      converting.value = false;
      return;
    }
    ctx.drawImage(img, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          convertedBlob.value = blob;
          convertedPreview.value = URL.createObjectURL(blob);
          downloadBlob(blob);
        }
        converting.value = false;
      },
      targetFormat.value,
      quality.value / 100
    );
  };
  img.onerror = () => {
    converting.value = false;
  };
  img.src = originalPreview.value;
}

function downloadBlob(blob: Blob) {
  if (!originalFile.value) return;

  const extMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
  };
  const ext = extMap[targetFormat.value] || 'png';
  const filename = originalFile.value.name.replace(/\.[^.]+$/, '') + '_converted.' + ext;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>
