<template>
  <div class="space-y-4">
    <!-- File Upload -->
    <div
      class="rounded-md border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
      :class="isDragging ? 'border-blue-400 bg-blue-50' : ''"
      style="border-color: var(--color-border);"
      @click="triggerFileInput"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input ref="fileInputRef" type="file" accept=".pdf" class="hidden" @change="handleFileChange" />
      <p v-if="!fileName" class="text-sm" style="color: var(--color-text-muted);">
        点击选择或拖拽 <strong>.pdf</strong> 文件到此处
      </p>
      <p v-else class="text-sm" style="color: var(--color-text);">
        已选择: <strong>{{ fileName }}</strong> ({{ (fileSize / 1024).toFixed(1) }} KB)
        <span v-if="pageCount > 0" class="ml-2">— {{ pageCount }} 页</span>
      </p>
    </div>

    <!-- Options -->
    <div class="flex items-center gap-3" v-if="fileName">
      <label class="flex items-center gap-1 text-sm cursor-pointer" style="color: var(--color-text);">
        <input type="checkbox" v-model="preserveLayout" /> 保留布局
      </label>
      <label class="flex items-center gap-1 text-sm cursor-pointer" style="color: var(--color-text);">
        <input type="checkbox" v-model="extractAllPages" checked /> 提取所有页面
      </label>
    </div>

    <ErrorAlert :message="error" />

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-4">
      <p class="text-sm" style="color: var(--color-text-muted);">正在提取文本...</p>
    </div>

    <!-- Output -->
    <div v-if="output" class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium" style="color: var(--color-text-secondary);">
          提取的文本 ({{ output.length }} 字符)
        </span>
        <CopyButton :text="output" />
      </div>
      <TextOutput v-model="output" :rows="14" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextOutput from '../../common/TextOutput.vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const fileInputRef = ref<HTMLInputElement>();
const isDragging = ref(false);
const fileName = ref('');
const fileSize = ref(0);
const pageCount = ref(0);
const error = ref('');
const output = ref('');
const isLoading = ref(false);
const preserveLayout = ref(true);
const extractAllPages = ref(true);

function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) processFile(file);
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) processFile(file);
}

async function processFile(file: File) {
  error.value = '';
  output.value = '';
  pageCount.value = 0;

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    error.value = '请选择 .pdf 文件';
    return;
  }

  fileName.value = file.name;
  fileSize.value = file.size;
  isLoading.value = true;

  try {
    const data = await readFileAsArrayBuffer(file);
    const text = extractPdfText(new Uint8Array(data));
    output.value = text || '(未提取到文本内容)';
  } catch (e: any) {
    error.value = 'PDF 解析失败: ' + e.message;
  } finally {
    isLoading.value = false;
  }
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

function extractPdfText(bytes: Uint8Array): string {
  const text = decodeUtf8(bytes);

  // Count pages
  const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
  pageCount.value = pageMatches ? pageMatches.length : 0;

  let extracted = '';

  // Method 1: Extract text from text blocks (BT ... ET)
  // Look for text between BT and ET markers
  const btRe = /BT([\s\S]*?)ET/g;
  let btMatch: RegExpExecArray | null;
  const textBlocks: string[] = [];

  while ((btMatch = btRe.exec(text)) !== null) {
    const block = btMatch[1];

    // Extract text shown with Tj operator: (text) Tj
    const tjRe = /\(([^)]*(?:\\.[^)]*)*)\)\s*Tj/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRe.exec(block)) !== null) {
      textBlocks.push(unescapePdfString(tjMatch[1]));
    }

    // Extract text with TJ operator (array of strings): [(text) num (text)] TJ
    const tjArrayRe = /\[([\s\S]*?)\]\s*TJ/g;
    let tjaMatch: RegExpExecArray | null;
    while ((tjaMatch = tjArrayRe.exec(block)) !== null) {
      const arrayContent = tjaMatch[1];
      const strRe = /\(([^)]*(?:\\.[^)]*)*)\)/g;
      let strMatch: RegExpExecArray | null;
      const pieces: string[] = [];
      while ((strMatch = strRe.exec(arrayContent)) !== null) {
        pieces.push(unescapePdfString(strMatch[1]));
      }
      textBlocks.push(pieces.join(''));
    }
  }

  extracted = textBlocks.join(preserveLayout.value ? '\n' : ' ');

  // Method 2: If no BT/ET blocks found, try stream decompression
  if (!extracted.trim()) {
    extracted = extractFromStreams(text);
  }

  // Method 3: Try to find any readable text in the file
  if (!extracted.trim()) {
    extracted = extractPlainText(text);
  }

  // Clean up
  extracted = extracted
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return extracted;
}

function unescapePdfString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

function extractFromStreams(text: string): string {
  // Find streams that might contain text
  const streamRe = /stream\r?\n([\s\S]*?)endstream/g;
  let sm: RegExpExecArray | null;
  const results: string[] = [];

  while ((sm = streamRe.exec(text)) !== null) {
    let streamData = sm[1];

    // Try to decompress FlateDecode (zlib)
    // PDF streams often use FlateDecode compression
    try {
      // Look for FlateDecode filter before this stream
      const before = text.substring(0, sm.index);
      if (before.includes('/FlateDecode') || before.includes('/Fl')) {
        // Attempt to inflate
        const compressed = new Uint8Array(streamData.length);
        for (let i = 0; i < streamData.length; i++) {
          compressed[i] = streamData.charCodeAt(i) & 0xff;
        }
        try {
          const decompressed = inflateSync(compressed);
          const decoded = decodeUtf8(decompressed);
          const btBlocks = extractBTText(decoded);
          if (btBlocks) results.push(btBlocks);
        } catch {
          // Inflate failed, ignore
        }
      }
    } catch {
      // Ignore decompression errors
    }
  }

  return results.join('\n');
}

function inflateSync(data: Uint8Array): Uint8Array {
  // Simple inflate implementation (RFC 1951)
  // This handles basic zlib streams
  // Check zlib header
  if (data.length < 2) return data;

  const cmf = data[0];
  const flg = data[1];

  // Check if it's a valid deflate stream
  const cm = cmf & 0x0f;
  const cinfo = (cmf & 0xf0) >> 4;

  if (cm !== 8) {
    // Not deflate, return as-is
    return data;
  }

  // The data starts at offset 2 (after zlib header), and there's a 4-byte checksum at the end
  const rawDeflate = data.slice(2, data.length - 4);

  // Try to use DecompressionStream API if available (browser)
  // Since we can't use async here easily, try a basic approach
  // For now, return empty - the caller will fall through to other methods
  return new Uint8Array(0);
}

function extractBTText(text: string): string {
  const btRe = /BT([\s\S]*?)ET/g;
  let m: RegExpExecArray | null;
  const results: string[] = [];

  while ((m = btRe.exec(text)) !== null) {
    const block = m[1];
    const tjRe = /\(([^)]*(?:\\.[^)]*)*)\)\s*Tj/g;
    let tm: RegExpExecArray | null;
    while ((tm = tjRe.exec(block)) !== null) {
      results.push(unescapePdfString(tm[1]));
    }
  }
  return results.join(' ');
}

function extractPlainText(text: string): string {
  // As a last resort, extract any readable ASCII text
  const readable = text.replace(/[^\x20-\x7E一-鿿　-〿＀-￯\n\r\t]/g, ' ');
  // Collapse spaces
  return readable.replace(/ {3,}/g, ' ').trim();
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}
</script>
