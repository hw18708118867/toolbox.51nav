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
          <p class="text-xs" style="color: var(--color-text-muted);">{{ formatSize(originalFile.size) }}</p>
        </div>
        <button @click="removeFile" class="text-xs px-2 py-1 rounded-md border" style="color: var(--color-text-muted); border-color: var(--color-border);">
          移除
        </button>
      </div>
    </div>

    <div v-if="originalFile" class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">压缩质量: {{ quality }}%</label>
        <input
          type="range"
          v-model.number="quality"
          min="10"
          max="100"
          class="w-full"
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">输出格式</label>
        <select
          v-model="outputFormat"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        >
          <option value="original">保持原格式</option>
          <option value="image/jpeg">JPEG</option>
          <option value="image/webp">WebP</option>
          <option value="image/png">PNG</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">最大宽度 (px, 可选)</label>
        <input
          v-model.number="maxWidth"
          type="number"
          min="0"
          placeholder="不限制"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">最大高度 (px, 可选)</label>
        <input
          v-model.number="maxHeight"
          type="number"
          min="0"
          placeholder="不限制"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        />
      </div>
    </div>

    <div v-if="originalFile" class="flex justify-end gap-2">
      <button
        @click="compress"
        :disabled="compressing"
        class="btn-primary"
      >
        {{ compressing ? '压缩中...' : '压缩图片' }}
      </button>
    </div>

    <div v-if="compressedBlob" class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <div class="flex items-center gap-3 mb-3">
        <img :src="compressedPreview" class="w-16 h-16 object-cover rounded-md border" style="border-color: var(--color-border);" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium" style="color: var(--color-text);">压缩结果</p>
          <p class="text-xs" style="color: var(--color-text-muted);">
            原始: {{ formatSize(originalFile.size) }} → 压缩后: {{ formatSize(compressedBlob.size) }}
            （节省 {{ compressionRatio }}%）
          </p>
        </div>
        <button
          @click="download"
          class="btn-primary"
        >
          下载
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const fileInputRef = ref<HTMLInputElement>();
const isDragging = ref(false);
const originalFile = ref<File | null>(null);
const originalPreview = ref('');
const compressedBlob = ref<Blob | null>(null);
const compressedPreview = ref('');
const compressing = ref(false);
const quality = ref(80);
const outputFormat = ref('original');
const maxWidth = ref<number | null>(null);
const maxHeight = ref<number | null>(null);

const compressionRatio = computed(() => {
  if (!originalFile.value || !compressedBlob.value) return '0';
  const ratio = ((1 - compressedBlob.value.size / originalFile.value.size) * 100).toFixed(1);
  return ratio;
});

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
  compressedBlob.value = null;
  compressedPreview.value = '';
  originalFile.value = file;
  const reader = new FileReader();
  reader.onload = () => {
    originalPreview.value = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function removeFile() {
  originalFile.value = null;
  originalPreview.value = '';
  compressedBlob.value = null;
  compressedPreview.value = '';
}

function compress() {
  if (!originalFile.value) return;
  compressing.value = true;

  const img = new Image();
  img.onload = () => {
    let w = img.naturalWidth;
    let h = img.naturalHeight;

    if (maxWidth.value && w > maxWidth.value) {
      h = Math.round(h * (maxWidth.value / w));
      w = maxWidth.value;
    }
    if (maxHeight.value && h > maxHeight.value) {
      w = Math.round(w * (maxHeight.value / h));
      h = maxHeight.value;
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      compressing.value = false;
      return;
    }
    ctx.drawImage(img, 0, 0, w, h);

    let mimeType = outputFormat.value;
    if (mimeType === 'original') {
      mimeType = originalFile.value!.type || 'image/png';
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          compressedBlob.value = blob;
          compressedPreview.value = URL.createObjectURL(blob);
        }
        compressing.value = false;
      },
      mimeType,
      quality.value / 100
    );
  };
  img.onerror = () => {
    compressing.value = false;
  };
  img.src = originalPreview.value;
}

function download() {
  if (!compressedBlob.value || !originalFile.value) return;

  const ext = outputFormat.value === 'original'
    ? (originalFile.value.name.split('.').pop() || 'png')
    : outputFormat.value.split('/')[1];
  const filename = originalFile.value.name.replace(/\.[^.]+$/, '') + '_compressed.' + ext;

  const url = URL.createObjectURL(compressedBlob.value);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>
