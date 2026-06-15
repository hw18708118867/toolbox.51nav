<template>
  <div class="space-y-4">
    <TabView :tabs="['分割图片', '拼接图片']">
      <!-- Tab 0: 分割图片 -->
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
              <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">行数</label>
              <input v-model.number="rows" type="number" min="1" max="10" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">列数</label>
              <input v-model.number="cols" type="number" min="1" max="10" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" />
            </div>
          </div>

          <div v-if="originalUrl" class="flex gap-2">
            <button @click="doSplit" class="btn-primary" :disabled="rows < 1 || cols < 1">分割图片</button>
          </div>

          <div v-if="pieces.length > 0" class="space-y-3">
            <p class="text-xs font-medium" style="color: var(--color-text-secondary);">
              分割结果（{{ pieces.length }} 块，{{ rows }}行 x {{ cols }}列）
            </p>
            <div class="grid gap-2" :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }">
              <div v-for="(piece, idx) in pieces" :key="idx" class="rounded-md border overflow-hidden" style="border-color: var(--color-border); background-color: var(--color-bg-tertiary);">
                <img :src="piece" class="w-full h-auto block" />
                <div class="p-1.5 flex justify-center">
                  <button @click="downloadPiece(idx)" class="text-xs px-2 py-1 rounded" style="color: var(--color-primary);">
                    下载 #{{ idx + 1 }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Tab 1: 拼接图片 -->
      <template #tab-1>
        <div class="space-y-4">
          <div
            class="rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer"
            :style="isDragging2
              ? 'border-color: var(--color-primary); background-color: var(--color-bg-tertiary);'
              : 'border-color: var(--color-border); background-color: var(--color-bg-secondary);'"
            @dragover.prevent="isDragging2 = true"
            @dragleave.prevent="isDragging2 = false"
            @drop.prevent="onDropJoin"
            @click="triggerFileInputJoin"
          >
            <input ref="fileInputJoinRef" type="file" accept="image/*" multiple class="hidden" @change="onFileSelectJoin" />
            <svg class="mx-auto mb-2" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--color-text-muted);">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            <p class="text-sm" style="color: var(--color-text-secondary);">拖拽多张图片或点击选择</p>
          </div>

          <div v-if="joinFiles.length > 0" class="space-y-2">
            <p class="text-xs font-medium" style="color: var(--color-text-secondary);">已添加 {{ joinFiles.length }} 张图片</p>
            <div class="flex flex-wrap gap-2">
              <div v-for="(f, idx) in joinFiles" :key="idx" class="rounded-md border p-2 flex items-center gap-2" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
                <img :src="joinPreviews[idx]" class="w-10 h-10 object-cover rounded" />
                <span class="text-xs truncate max-w-[120px]" style="color: var(--color-text);">{{ f.name }}</span>
                <button @click="removeJoinFile(idx)" class="text-xs" style="color: var(--color-text-muted);">x</button>
              </div>
            </div>
          </div>

          <div v-if="joinFiles.length >= 2" class="space-y-3">
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
                <input v-model="joinDirection" type="radio" value="horizontal" class="rounded" style="accent-color: var(--color-primary);" />
                水平拼接
              </label>
              <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
                <input v-model="joinDirection" type="radio" value="vertical" class="rounded" style="accent-color: var(--color-primary);" />
                垂直拼接
              </label>
            </div>

            <div class="flex justify-end gap-2">
              <button @click="doJoin" class="btn-primary">拼接图片</button>
            </div>
          </div>

          <div v-if="joinedUrl" class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
            <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">拼接结果</p>
            <img :src="joinedUrl" class="max-w-full max-h-64 object-contain rounded" />
            <div class="flex justify-end mt-3">
              <button @click="downloadJoin" class="btn-primary">下载结果</button>
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

// --- Split ---
const fileInputRef = ref<HTMLInputElement>();
const isDragging = ref(false);
const originalUrl = ref('');
const rows = ref(2);
const cols = ref(2);
const pieces = ref<string[]>([]);
let splitImage: HTMLImageElement | null = null;

function triggerFileInput() { fileInputRef.value?.click(); }
function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files?.[0]) loadSplitFile(input.files[0]);
}
function onDrop(e: DragEvent) { isDragging.value = false; const f = e.dataTransfer?.files?.[0]; if (f) loadSplitFile(f); }

function loadSplitFile(file: File) {
  pieces.value = [];
  const reader = new FileReader();
  reader.onload = () => {
    splitImage = new Image();
    splitImage.onload = () => { originalUrl.value = reader.result as string; };
    splitImage.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function doSplit() {
  if (!splitImage || rows.value < 1 || cols.value < 1) return;
  const r = rows.value;
  const c = cols.value;
  const pw = Math.floor(splitImage.naturalWidth / c);
  const ph = Math.floor(splitImage.naturalHeight / r);
  const results: string[] = [];

  for (let row = 0; row < r; row++) {
    for (let col = 0; col < c; col++) {
      const canvas = document.createElement('canvas');
      canvas.width = pw;
      canvas.height = ph;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(splitImage, col * pw, row * ph, pw, ph, 0, 0, pw, ph);
        results.push(canvas.toDataURL('image/png'));
      }
    }
  }
  pieces.value = results;
}

function downloadPiece(idx: number) {
  const a = document.createElement('a');
  a.href = pieces.value[idx];
  a.download = `piece_${idx + 1}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// --- Join ---
const fileInputJoinRef = ref<HTMLInputElement>();
const isDragging2 = ref(false);
const joinFiles = ref<File[]>([]);
const joinPreviews = ref<string[]>([]);
const joinDirection = ref('horizontal');
const joinedUrl = ref('');
let joinImages: HTMLImageElement[] = [];

function triggerFileInputJoin() { fileInputJoinRef.value?.click(); }
function onFileSelectJoin(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files) addJoinFiles(Array.from(input.files));
}
function onDropJoin(e: DragEvent) {
  isDragging2.value = false;
  if (e.dataTransfer?.files) addJoinFiles(Array.from(e.dataTransfer.files));
}

function addJoinFiles(files: File[]) {
  joinedUrl.value = '';
  for (const file of files) {
    joinFiles.value.push(file);
    const reader = new FileReader();
    reader.onload = () => {
      joinPreviews.value.push(reader.result as string);
      const img = new Image();
      img.onload = () => { joinImages.push(img); };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
}

function removeJoinFile(idx: number) {
  joinFiles.value.splice(idx, 1);
  joinPreviews.value.splice(idx, 1);
  joinImages.splice(idx, 1);
  joinedUrl.value = '';
}

function doJoin() {
  if (joinImages.length < 2) return;
  const isH = joinDirection.value === 'horizontal';

  let totalW = 0, totalH = 0;
  if (isH) {
    totalW = joinImages.reduce((sum, img) => sum + img.naturalWidth, 0);
    totalH = Math.max(...joinImages.map(img => img.naturalHeight));
  } else {
    totalW = Math.max(...joinImages.map(img => img.naturalWidth));
    totalH = joinImages.reduce((sum, img) => sum + img.naturalHeight, 0);
  }

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let offset = 0;
  for (const img of joinImages) {
    if (isH) {
      const y = (totalH - img.naturalHeight) / 2;
      ctx.drawImage(img, offset, y);
      offset += img.naturalWidth;
    } else {
      const x = (totalW - img.naturalWidth) / 2;
      ctx.drawImage(img, x, offset);
      offset += img.naturalHeight;
    }
  }

  joinedUrl.value = canvas.toDataURL('image/png');
}

function downloadJoin() {
  if (!joinedUrl.value) return;
  const a = document.createElement('a');
  a.href = joinedUrl.value;
  a.download = 'joined_image.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
</script>
