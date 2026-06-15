<template>
  <div class="space-y-4">
    <TabView :tabs="['图片转Base64', 'Base64转图片']">
      <template #tab-0>
        <div class="space-y-3">
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
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onFileSelect"
            />
            <svg class="mx-auto mb-2" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--color-text-muted);">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p class="text-sm" style="color: var(--color-text-secondary);">点击或拖拽图片到此处</p>
          </div>

          <div v-if="imageFile" class="flex items-center gap-3 rounded-md border p-3" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
            <img :src="previewUrl" class="w-12 h-12 object-cover rounded" />
            <span class="text-sm flex-1 truncate" style="color: var(--color-text);">{{ imageFile.name }}</span>
          </div>

          <TextOutput v-model="base64Output" label="Base64 数据 URI" :rows="8" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="base64Input" label="Base64 字符串" placeholder="data:image/png;base64,iVBORw0KGgo..." :rows="8" show-count />

          <div class="flex justify-end">
            <button
              @click="decodeBase64"
              :disabled="!base64Input.trim()"
              class="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              解码显示
            </button>
          </div>

          <ErrorAlert :message="decodeError" />

          <div v-if="decodedUrl" class="space-y-2">
            <p class="text-xs font-medium" style="color: var(--color-text-secondary);">图片预览</p>
            <div class="rounded-lg border overflow-hidden" style="border-color: var(--color-border); background-color: var(--color-bg-tertiary);">
              <img :src="decodedUrl" class="w-full max-h-64 object-contain" />
            </div>
            <div class="flex justify-end">
              <button
                @click="downloadDecoded"
                class="btn-primary"
              >
                下载图片
              </button>
            </div>
          </div>
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import TabView from '../../common/TabView.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

// Tab 0: Image to Base64
const fileInputRef = ref<HTMLInputElement>();
const isDragging = ref(false);
const imageFile = ref<File | null>(null);
const previewUrl = ref('');
const base64Output = ref('');

// Tab 1: Base64 to Image
const base64Input = ref('');
const decodedUrl = ref('');
const decodeError = ref('');

function triggerFileInput() {
  fileInputRef.value?.click();
}

function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    processFile(input.files[0]);
  }
}

function onDrop(event: DragEvent) {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) processFile(file);
}

function processFile(file: File) {
  imageFile.value = file;
  const reader = new FileReader();
  reader.onload = () => {
    base64Output.value = reader.result as string;
    previewUrl.value = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function decodeBase64() {
  decodeError.value = '';
  decodedUrl.value = '';

  try {
    let base64 = base64Input.value.trim();

    // Handle data URI format
    if (base64.startsWith('data:')) {
      decodedUrl.value = base64;
      return;
    }

    // Handle raw base64 (try to detect image type)
    let mimeType = 'image/png';
    // Check for common base64 image signatures
    if (base64.startsWith('/9j/')) {
      mimeType = 'image/jpeg';
    } else if (base64.startsWith('iVBORw0KGgo')) {
      mimeType = 'image/png';
    } else if (base64.startsWith('R0lGOD')) {
      mimeType = 'image/gif';
    } else if (base64.startsWith('UklGR')) {
      mimeType = 'image/webp';
    }

    decodedUrl.value = `data:${mimeType};base64,${base64}`;
  } catch (e: any) {
    decodeError.value = '解码失败: ' + e.message;
  }
}

function downloadDecoded() {
  if (!decodedUrl.value) return;
  const a = document.createElement('a');
  a.href = decodedUrl.value;
  a.download = 'decoded_image';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
</script>
