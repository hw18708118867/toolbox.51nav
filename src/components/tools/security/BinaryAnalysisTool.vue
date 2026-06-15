<template>
  <div class="space-y-4">
    <TabView :tabs="['文件分析', 'HEX 输入']">
      <!-- Tab 0: File Upload -->
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
            <input ref="fileInputRef" type="file" class="hidden" @change="onFileSelect" />
            <svg class="mx-auto mb-2" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--color-text-muted);">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <p class="text-sm" style="color: var(--color-text-secondary);">拖拽文件或点击选择</p>
          </div>

          <ErrorAlert :message="error" />

          <div v-if="fileBuffer" class="space-y-3">
            <!-- File info -->
            <div class="rounded-md border p-3" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
              <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">文件信息</p>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <span style="color: var(--color-text-muted);">文件名:</span>
                <span style="color: var(--color-text);">{{ fileName }}</span>
                <span style="color: var(--color-text-muted);">大小:</span>
                <span style="color: var(--color-text);">{{ formatSize(fileBuffer.byteLength) }}</span>
                <span style="color: var(--color-text-muted);">Magic Bytes:</span>
                <code class="font-mono" style="color: var(--color-text);">{{ magicBytesStr }}</code>
                <span style="color: var(--color-text-muted);">MIME 猜测:</span>
                <span style="color: var(--color-text);">{{ mimeGuess }}</span>
              </div>
            </div>

            <!-- Search -->
            <div class="flex items-center gap-2">
              <input
                v-model="searchHex"
                type="text"
                placeholder="搜索 HEX 序列 (如: FF D8 FF)"
                class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none font-mono"
                style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
              />
              <button @click="doSearch" class="btn-primary text-xs">搜索</button>
              <button @click="clearSearch" v-if="searchResults.length > 0" class="text-xs px-2 py-1 rounded border" style="color: var(--color-text-muted); border-color: var(--color-border);">
                清除
              </button>
            </div>
            <p v-if="searchResults.length > 0" class="text-xs" style="color: var(--color-text-muted);">
              找到 {{ searchResults.length }} 处匹配
            </p>

            <!-- Hex viewer -->
            <div class="rounded-md border overflow-auto" style="max-height: 500px; border-color: var(--color-border); background-color: var(--color-bg-secondary);">
              <table class="w-full text-xs font-mono">
                <tbody>
                  <tr
                    v-for="(line, lidx) in hexLines"
                    :key="lidx"
                    :style="isSearchMatchLine(lidx) ? 'background-color: rgba(59,130,246,0.1);' : ''"
                  >
                    <td class="px-2 py-0.5 select-none" style="color: var(--color-text-muted);">{{ formatOffset(lidx * 16) }}</td>
                    <td class="px-1 py-0.5">
                      <span
                        v-for="(byte, bidx) in line"
                        :key="bidx"
                        :style="isSearchMatchByte(lidx * 16 + bidx) ? 'background-color: var(--color-primary); color: white; border-radius: 2px;' : 'color: var(--color-text);'"
                        class="inline-block w-6 text-center"
                      >{{ byte }}</span>
                    </td>
                    <td class="px-2 py-0.5" style="color: var(--color-text-muted);">
                      <span
                        v-for="(ch, cidx) in line"
                        :key="cidx"
                      >{{ byteToAscii(ch) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p class="text-xs" style="color: var(--color-text-muted);">
              显示 {{ Math.min(displayLimit, hexLines.length) }} / {{ hexLines.length }} 行
              <button v-if="hexLines.length > displayLimit" @click="displayLimit += 500" class="ml-2 underline" style="color: var(--color-primary);">加载更多</button>
            </p>
          </div>
        </div>
      </template>

      <!-- Tab 1: HEX Input -->
      <template #tab-1>
        <div class="space-y-4">
          <div>
            <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">粘贴 HEX 数据</label>
            <textarea
              v-model="hexInput"
              :rows="8"
              placeholder="粘贴十六进制数据，如:&#10;48 65 6C 6C 6F 20 57 6F 72 6C 64&#10;或: 48656C6C6F20576F726C64"
              class="w-full rounded-xl px-4 py-3 text-sm resize-y font-mono"
              style="background-color: var(--color-bg-secondary); border: 1px solid var(--color-border); color: var(--color-text);"
            />
          </div>

          <div class="flex justify-end gap-2">
            <button @click="parseHexInput" :disabled="!hexInput.trim()" class="btn-primary">
              解析 HEX
            </button>
          </div>

          <div v-if="parsedText" class="space-y-2">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">ASCII / UTF-8 字符串</label>
            <textarea
              :value="parsedText"
              readonly
              :rows="6"
              class="w-full rounded-xl px-4 py-3 text-sm resize-y font-mono"
              style="background-color: var(--color-bg-secondary); border: 1px solid var(--color-border); color: var(--color-text);"
            />
          </div>
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import TabView from '../../common/TabView.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

// --- File analysis ---
const fileInputRef = ref<HTMLInputElement>();
const isDragging = ref(false);
const fileBuffer = ref<ArrayBuffer | null>(null);
const fileName = ref('');
const error = ref('');
const searchHex = ref('');
const searchResults = ref<number[]>([]);
const displayLimit = ref(500);

// --- HEX input ---
const hexInput = ref('');
const parsedText = ref('');

function triggerFileInput() { fileInputRef.value?.click(); }
function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files?.[0]) loadFile(input.files[0]);
}
function onDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) loadFile(file);
}

function loadFile(file: File) {
  error.value = '';
  searchResults.value = [];
  fileName.value = file.name;
  displayLimit.value = 500;
  const reader = new FileReader();
  reader.onload = () => { fileBuffer.value = reader.result as ArrayBuffer; };
  reader.onerror = () => { error.value = '文件读取失败。'; };
  reader.readAsArrayBuffer(file);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatOffset(offset: number): string {
  return '0x' + offset.toString(16).toUpperCase().padStart(8, '0');
}

const magicBytes = computed(() => {
  if (!fileBuffer.value || fileBuffer.value.byteLength < 4) return [];
  return new Uint8Array(fileBuffer.value, 0, Math.min(8, fileBuffer.value.byteLength));
});

const magicBytesStr = computed(() => {
  return Array.from(magicBytes.value).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
});

const mimeGuess = computed(() => {
  const bytes = magicBytes.value;
  if (bytes.length < 2) return '未知';
  const b0 = bytes[0], b1 = bytes[1], b2 = bytes[2] || 0, b3 = bytes[3] || 0;

  if (b0 === 0xFF && b1 === 0xD8 && b2 === 0xFF) return 'image/jpeg';
  if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4E && b3 === 0x47) return 'image/png';
  if (b0 === 0x47 && b1 === 0x49 && b2 === 0x46) return 'image/gif';
  if (b0 === 0x52 && b1 === 0x49 && b2 === 0x46 && b3 === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp';
  if (b0 === 0x42 && b1 === 0x4D) return 'image/bmp';
  if (b0 === 0x00 && b1 === 0x00 && b2 === 0x01 && b3 === 0x00) return 'image/x-icon';
  if (b0 === 0x50 && b1 === 0x4B && b2 === 0x03 && b3 === 0x04) return 'application/zip';
  if (b0 === 0x25 && b1 === 0x50 && b2 === 0x44 && b3 === 0x46) return 'application/pdf';
  if (b0 === 0x1F && b1 === 0x8B && b2 === 0x08) return 'application/gzip';
  if (b0 === 0x7F && b1 === 0x45 && b2 === 0x4C && b3 === 0x46) return 'application/x-elf';
  if (b0 === 0x4D && b1 === 0x5A) return 'application/x-dosexec (PE/EXE)';
  if (b0 === 0xCA && b1 === 0xFE && b2 === 0xBA && b3 === 0xBE) return 'application/java-class';
  if ((b0 === 0x3C && b1 === 0x3F) || (b0 === 0x3C && b1 === 0x73)) return 'text/xml or text/html';
  if (b0 >= 0x20 && b0 <= 0x7E) return 'text/plain (可能是)';
  return 'application/octet-stream';
});

const fullBytes = computed(() => {
  if (!fileBuffer.value) return new Uint8Array();
  return new Uint8Array(fileBuffer.value);
});

const hexLines = computed(() => {
  const bytes = fullBytes.value;
  const lines: string[][] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const line: string[] = [];
    for (let j = i; j < i + 16 && j < bytes.length; j++) {
      line.push(bytes[j].toString(16).toUpperCase().padStart(2, '0'));
    }
    lines.push(line);
  }
  return lines;
});

function byteToAscii(hex: string): string {
  const byte = parseInt(hex, 16);
  return (byte >= 0x20 && byte <= 0x7E) ? String.fromCharCode(byte) : '.';
}

function doSearch() {
  searchResults.value = [];
  const query = searchHex.value.replace(/\s+/g, '').toUpperCase();
  if (!query || query.length % 2 !== 0) return;
  const searchBytes: number[] = [];
  for (let i = 0; i < query.length; i += 2) {
    searchBytes.push(parseInt(query.substring(i, i + 2), 16));
  }
  const bytes = fullBytes.value;
  for (let i = 0; i <= bytes.length - searchBytes.length; i++) {
    let match = true;
    for (let j = 0; j < searchBytes.length; j++) {
      if (bytes[i + j] !== searchBytes[j]) { match = false; break; }
    }
    if (match) searchResults.value.push(i);
  }
}

function clearSearch() {
  searchResults.value = [];
  searchHex.value = '';
}

function isSearchMatchLine(lineIdx: number): boolean {
  const start = lineIdx * 16;
  const end = start + 15;
  return searchResults.value.some(r => r >= start && r <= end);
}

function isSearchMatchByte(offset: number): boolean {
  return searchResults.value.includes(offset);
}

watch(() => fileBuffer.value, () => {
  searchResults.value = [];
  searchHex.value = '';
});

function parseHexInput() {
  let hex = hexInput.value.replace(/\s+/g, '').replace(/^0[xX]/, '');
  if (hex.length % 2 !== 0) {
    error.value = 'HEX 字符串长度必须为偶数';
    return;
  }
  try {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    parsedText.value = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    error.value = '';
  } catch (e: any) {
    error.value = 'HEX 解析失败: ' + e.message;
  }
}
</script>
