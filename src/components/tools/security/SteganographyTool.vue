<template>
  <div class="space-y-4">
    <TabView :tabs="['隐藏文本', '提取文本']">
      <!-- Tab 0: Encode (hide text) -->
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
            <input ref="fileInputRef" type="file" accept="image/png" class="hidden" @change="onFileSelect" />
            <svg class="mx-auto mb-2" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--color-text-muted);">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p class="text-sm mb-1" style="color: var(--color-text-secondary);">拖拽 PNG 载体图片到此处或点击选择</p>
            <p class="text-xs" style="color: var(--color-text-muted);">必须使用 PNG 格式以保持无损编码</p>
          </div>

          <div v-if="originalUrl" class="rounded-md border p-3" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
            <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">载体图片</p>
            <img :src="originalUrl" class="max-w-full max-h-48 object-contain rounded" />
            <p class="text-xs mt-2" style="color: var(--color-text-muted);">
              可用容量: {{ maxCapacity }} 字符 ({{ formatSize(maxCapacity) }})
            </p>
          </div>

          <div v-if="originalUrl" class="space-y-3">
            <div>
              <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">要隐藏的文本</label>
              <textarea
                v-model="secretText"
                :rows="5"
                placeholder="在此输入要隐藏的秘密文本..."
                class="w-full rounded-xl px-4 py-3 text-sm resize-y"
                style="background-color: var(--color-bg-secondary); border: 1px solid var(--color-border); color: var(--color-text);"
              />
              <p class="text-xs mt-1" style="color: var(--color-text-muted);">
                当前文本长度: {{ secretText.length }} 字符 (最大 {{ maxCapacity }})
              </p>
            </div>

            <div class="flex justify-end gap-2">
              <button @click="encode" :disabled="!secretText.trim() || secretText.length > maxCapacity || encoding" class="btn-primary">
                {{ encoding ? '编码中...' : '隐藏文本到图片' }}
              </button>
            </div>
          </div>

          <ErrorAlert :message="encodeError" />

          <div v-if="encodedUrl" class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
            <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">含隐藏文本的图片</p>
            <p class="text-xs mb-3" style="color: var(--color-text-muted);">图片外观与原图几乎没有区别（视觉上不可察觉的修改）</p>
            <img :src="encodedUrl" class="max-w-full max-h-48 object-contain rounded" />
            <div class="flex justify-end mt-3">
              <button @click="downloadEncoded" class="btn-primary">下载图片</button>
            </div>
          </div>
        </div>
      </template>

      <!-- Tab 1: Decode (extract text) -->
      <template #tab-1>
        <div class="space-y-4">
          <div
            class="rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer"
            :style="isDragging2
              ? 'border-color: var(--color-primary); background-color: var(--color-bg-tertiary);'
              : 'border-color: var(--color-border); background-color: var(--color-bg-secondary);'"
            @dragover.prevent="isDragging2 = true"
            @dragleave.prevent="isDragging2 = false"
            @drop.prevent="onDropDecode"
            @click="triggerDecodeFileInput"
          >
            <input ref="decodeFileInputRef" type="file" accept="image/png" class="hidden" @change="onDecodeFileSelect" />
            <svg class="mx-auto mb-2" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--color-text-muted);">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
            <p class="text-sm mb-1" style="color: var(--color-text-secondary);">拖拽含隐藏文本的 PNG 图片到此处或点击选择</p>
            <p class="text-xs" style="color: var(--color-text-muted);">将提取隐藏在图片 LSB 中的文本</p>
          </div>

          <div v-if="decodeImageUrl" class="rounded-md border p-3" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
            <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">载体图片</p>
            <img :src="decodeImageUrl" class="max-w-full max-h-48 object-contain rounded" />
          </div>

          <div v-if="decodeImageUrl" class="flex justify-end">
            <button @click="decode" :disabled="decoding" class="btn-primary">
              {{ decoding ? '解码中...' : '提取隐藏文本' }}
            </button>
          </div>

          <ErrorAlert :message="decodeError" />

          <div v-if="extractedText" class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-medium" style="color: var(--color-text-secondary);">提取的文本</label>
              <CopyButton :text="extractedText" />
            </div>
            <textarea
              :value="extractedText"
              readonly
              :rows="8"
              class="w-full rounded-xl px-4 py-3 text-sm resize-y font-mono"
              style="background-color: var(--color-bg-secondary); border: 1px solid var(--color-border); color: var(--color-text);"
            />
          </div>
        </div>
      </template>
    </TabView>

    <!-- Info note -->
    <div class="rounded-md border p-3" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <p class="text-xs font-medium mb-1" style="color: var(--color-text-secondary);">关于 LSB 隐写术</p>
      <p class="text-xs" style="color: var(--color-text-muted);">
        LSB（Least Significant Bit）隐写术通过修改像素的最低有效位来隐藏数据。每个像素的 R、G、B 三个通道各可存储 1 bit 数据，3 个像素可以存储约 1 个字符。修改最低位对人类肉眼不可见，因此图片外观几乎不变。注意：重新压缩图片（如 JPEG）会破坏隐藏的数据。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TabView from '../../common/TabView.vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

// --- Encode ---
const fileInputRef = ref<HTMLInputElement>();
const isDragging = ref(false);
const originalUrl = ref('');
const secretText = ref('');
const encodedUrl = ref('');
const encodeError = ref('');
const encoding = ref(false);

let encodeImage: HTMLImageElement | null = null;
let encodeCanvas: HTMLCanvasElement | null = null;

const maxCapacity = computed(() => {
  if (!encodeCanvas) return 0;
  // Each pixel has 3 channels (R,G,B), each stores 1 bit
  // Need 32 bits (4 bytes) for length header, remaining bits for text
  const pixels = encodeCanvas.width * encodeCanvas.height;
  const bits = pixels * 3;
  const headerBits = 32;
  const dataBits = bits - headerBits;
  return Math.max(0, Math.floor(dataBits / 8));
});

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function triggerFileInput() { fileInputRef.value?.click(); }
function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files?.[0]) loadEncodeImage(input.files[0]);
}
function onDrop(e: DragEvent) { isDragging.value = false; const f = e.dataTransfer?.files?.[0]; if (f) loadEncodeImage(f); }

function loadEncodeImage(file: File) {
  encodeError.value = '';
  encodedUrl.value = '';
  secretText.value = '';
  const reader = new FileReader();
  reader.onload = () => {
    encodeImage = new Image();
    encodeImage.onload = () => {
      originalUrl.value = reader.result as string;
      const canvas = document.createElement('canvas');
      canvas.width = encodeImage!.naturalWidth;
      canvas.height = encodeImage!.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(encodeImage!, 0, 0);
        encodeCanvas = canvas;
      }
    };
    encodeImage.onerror = () => { encodeError.value = '图片加载失败。'; };
    encodeImage.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function encode() {
  if (!encodeImage || !encodeCanvas || !secretText.value.trim()) return;
  encoding.value = true;
  encodeError.value = '';

  try {
    const ctx = encodeCanvas.getContext('2d');
    if (!ctx) { encodeError.value = 'Canvas 不支持'; encoding.value = false; return; }

    const w = encodeCanvas.width;
    const h = encodeCanvas.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Convert text to bits
    const textBytes = new TextEncoder().encode(secretText.value);
    if (textBytes.length > maxCapacity.value) {
      encodeError.value = `文本太长 (${textBytes.length} 字节 > ${maxCapacity.value} 字节)。请缩短文本或使用更大的图片。`;
      encoding.value = false;
      return;
    }

    // First 32 bits: length of text in bytes (big-endian)
    const headerBits = 32;
    const bits: number[] = [];

    // Length header
    for (let i = 0; i < headerBits; i++) {
      bits.push((textBytes.length >> (headerBits - 1 - i)) & 1);
    }

    // Data bits
    for (let i = 0; i < textBytes.length; i++) {
      for (let j = 7; j >= 0; j--) {
        bits.push((textBytes[i] >> j) & 1);
      }
    }

    // Embed bits into LSB of R, G, B channels
    for (let i = 0; i < bits.length; i++) {
      const pixelIndex = Math.floor(i / 3);
      const channel = i % 3; // 0=R, 1=G, 2=B
      const dataIndex = pixelIndex * 4 + channel;
      if (dataIndex < data.length) {
        // Clear LSB and set it
        data[dataIndex] = (data[dataIndex] & 0xFE) | bits[i];
      }
    }

    ctx.putImageData(imageData, 0, 0);
    encodedUrl.value = encodeCanvas.toDataURL('image/png');
  } catch (e: any) {
    encodeError.value = '编码失败: ' + e.message;
  } finally {
    encoding.value = false;
  }
}

function downloadEncoded() {
  if (!encodedUrl.value) return;
  const a = document.createElement('a');
  a.href = encodedUrl.value;
  a.download = 'stego_image.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// --- Decode ---
const decodeFileInputRef = ref<HTMLInputElement>();
const isDragging2 = ref(false);
const decodeImageUrl = ref('');
const extractedText = ref('');
const decodeError = ref('');
const decoding = ref(false);

function triggerDecodeFileInput() { decodeFileInputRef.value?.click(); }
function onDecodeFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files?.[0]) loadDecodeImage(input.files[0]);
}
function onDropDecode(e: DragEvent) { isDragging2.value = false; const f = e.dataTransfer?.files?.[0]; if (f) loadDecodeImage(f); }

function loadDecodeImage(file: File) {
  decodeError.value = '';
  extractedText.value = '';
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      decodeImageUrl.value = reader.result as string;
      (window as any).__decodeImage = img;
    };
    img.onerror = () => { decodeError.value = '图片加载失败。'; };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function decode() {
  const img: HTMLImageElement = (window as any).__decodeImage;
  if (!img) return;
  decoding.value = true;
  decodeError.value = '';
  extractedText.value = '';

  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) { decodeError.value = 'Canvas 不支持'; decoding.value = false; return; }

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Extract header: first 32 bits = text length
    let headerValue = 0;
    for (let i = 0; i < 32; i++) {
      const pixelIndex = Math.floor(i / 3);
      const channel = i % 3;
      const dataIndex = pixelIndex * 4 + channel;
      if (dataIndex >= data.length) break;
      const bit = data[dataIndex] & 1;
      headerValue = (headerValue << 1) | bit;
    }

    if (headerValue <= 0 || headerValue > data.length / 2) {
      decodeError.value = '未检测到有效的隐藏数据（长度头不合法）。此图片可能不包含 LSB 隐写内容。';
      decoding.value = false;
      return;
    }

    // Extract data
    const textBytes = new Uint8Array(headerValue);
    const startBit = 32;
    for (let i = 0; i < headerValue * 8; i++) {
      const pixelIndex = Math.floor((startBit + i) / 3);
      const channel = (startBit + i) % 3;
      const dataIndex = pixelIndex * 4 + channel;
      if (dataIndex >= data.length) break;
      const bit = data[dataIndex] & 1;
      const byteIndex = Math.floor(i / 8);
      const bitInByte = 7 - (i % 8);
      textBytes[byteIndex] |= bit << bitInByte;
    }

    extractedText.value = new TextDecoder().decode(textBytes);
  } catch (e: any) {
    decodeError.value = '解码失败: ' + e.message;
  } finally {
    decoding.value = false;
  }
}
</script>
