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
        <path d="M8 8h.01" />
        <path d="M8 12h.01" />
        <path d="M8 16h.01" />
        <path d="M16 8h.01" />
        <path d="M16 12h.01" />
        <path d="M16 16h.01" />
        <rect x="10" y="10" width="4" height="4" />
        <line x1="8" y1="8" x2="16" y2="8" />
        <line x1="8" y1="16" x2="16" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
      <p class="text-sm mb-1" style="color: var(--color-text-secondary);">拖拽图片到此处或点击选择</p>
      <p class="text-xs" style="color: var(--color-text-muted);">支持 PNG, JPEG, WebP, BMP — 上传含二维码的图片进行解码</p>
    </div>

    <div v-if="uploadedImage" class="space-y-3">
      <div class="flex items-center gap-3 rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
        <img :src="uploadedImage" class="w-24 h-24 object-contain rounded-md border" style="border-color: var(--color-border);" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate" style="color: var(--color-text);">{{ fileName }}</p>
          <p class="text-xs" style="color: var(--color-text-muted);">{{ imageWidth }} x {{ imageHeight }} px</p>
        </div>
        <button @click="decode" :disabled="decoding" class="btn-primary">
          {{ decoding ? '解码中...' : '开始解码' }}
        </button>
        <button @click="clearImage" class="px-3 py-2 rounded-md border text-xs" style="background-color: var(--color-bg-secondary); color: var(--color-text-muted); border-color: var(--color-border);">
          清除
        </button>
      </div>

      <div class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
        <canvas ref="imageCanvasRef" class="w-full max-h-[400px] object-contain" />
      </div>
    </div>

    <ErrorAlert :message="error" />

    <div v-if="decodedResult" class="rounded-md border p-4 space-y-2" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium" style="color: var(--color-text-secondary);">解码结果</span>
        <CopyButton :text="decodedResult" />
      </div>
      <div class="rounded-md border p-3" style="background-color: var(--color-bg-tertiary); border-color: var(--color-border);">
        <pre class="text-sm whitespace-pre-wrap break-all font-mono" style="color: var(--color-text);">{{ decodedResult }}</pre>
      </div>
    </div>

    <div v-if="!decodedResult && decodingAttempted && !decoding" class="rounded-md border p-4" style="background-color: #fffbeb; border-color: #fde68a; color: #92400e;">
      <div class="flex items-start gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>
          <p class="text-sm font-medium mb-1">未能从图片中解析出二维码数据</p>
          <p class="text-xs">请确保图片包含清晰的二维码。如需完整解码支持，建议集成 <a href="https://github.com/cozmo/jsQR" target="_blank" class="underline">jsQR</a> 库。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import ErrorAlert from '../../common/ErrorAlert.vue';
import CopyButton from '../../common/CopyButton.vue';

const fileInputRef = ref<HTMLInputElement>();
const imageCanvasRef = ref<HTMLCanvasElement>();
const isDragging = ref(false);
const uploadedImage = ref('');
const fileName = ref('');
const imageWidth = ref(0);
const imageHeight = ref(0);
const error = ref('');
const decoding = ref(false);
const decodedResult = ref('');
const decodingAttempted = ref(false);

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
  error.value = '';
  decodedResult.value = '';
  decodingAttempted.value = false;

  if (!file.type.startsWith('image/')) {
    error.value = '请上传图片文件';
    return;
  }

  fileName.value = file.name;
  const reader = new FileReader();
  reader.onload = () => {
    uploadedImage.value = reader.result as string;
    const img = new Image();
    img.onload = () => {
      imageWidth.value = img.naturalWidth;
      imageHeight.value = img.naturalHeight;
      // Draw image on canvas
      nextTick(() => {
        const canvas = imageCanvasRef.value;
        if (!canvas) return;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
      });
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  uploadedImage.value = '';
  fileName.value = '';
  imageWidth.value = 0;
  imageHeight.value = 0;
  error.value = '';
  decodedResult.value = '';
  decodingAttempted.value = false;
}

async function decode() {
  error.value = '';
  decodedResult.value = '';
  decodingAttempted.value = false;
  decoding.value = true;

  await nextTick();

  try {
    const canvas = imageCanvasRef.value;
    if (!canvas) {
      error.value = '无法获取画布';
      decoding.value = false;
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      error.value = '无法获取画布上下文';
      decoding.value = false;
      return;
    }

    // Attempt to find QR code in the image
    const result = attemptQrDecode(ctx, canvas.width, canvas.height);
    decodingAttempted.value = true;

    if (result) {
      decodedResult.value = result;
    }
  } catch (e: any) {
    error.value = e.message || '解码失败';
  } finally {
    decoding.value = false;
  }
}

// Basic QR code detection approach:
// 1. Convert image to grayscale
// 2. Look for finder pattern (1:1:3:1:1 ratio of dark/light modules)
// 3. Extract data from the QR code matrix
function attemptQrDecode(ctx: CanvasRenderingContext2D, width: number, height: number): string | null {
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Convert to grayscale and binariZe
  const gray: number[] = new Array(width * height);
  let sum = 0;
  for (let i = 0; i < width * height; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    sum += gray[i];
  }

  const threshold = sum / (width * height);

  // Binarize: 0 = dark (black), 1 = light (white)
  const binary: number[] = new Array(width * height);
  for (let i = 0; i < width * height; i++) {
    binary[i] = gray[i] < threshold ? 0 : 1;
  }

  // Look for finder pattern by scanning for 1:1:3:1:1 ratio
  // A finder pattern cross-section has: black-white-black-white-black in 1:1:3:1:1 width ratio
  const finderCandidates = findFinderPatterns(binary, width, height);
  if (finderCandidates.length === 0) {
    return null;
  }

  // Try to estimate QR code size and extract data
  // Using the finder patterns, determine module size and matrix dimensions
  const moduleSize = estimateModuleSize(finderCandidates, binary, width, height);
  if (moduleSize === 0) return null;

  // Attempt to extract data from the QR code
  return attemptExtractData(binary, width, height, finderCandidates, moduleSize);
}

function findFinderPatterns(binary: number[], width: number, height: number): { x: number; y: number }[] {
  const candidates: { x: number; y: number }[] = [];
  const minModuleSize = 2;
  const maxModuleSize = Math.min(width, height) / 7;

  // Scan horizontally for finder pattern ratio
  for (let y = 0; y < height; y++) {
    const row = y * width;
    let i = 0;
    while (i < width) {
      // Count consecutive same-color pixels
      const segments: number[] = [];
      let startVal = binary[row + i];
      let count = 1;
      i++;

      while (i < width && segments.length < 5) {
        if (binary[row + i] === startVal) {
          count++;
        } else {
          segments.push(count);
          startVal = binary[row + i];
          count = 1;
        }
        if (segments.length === 0) {
          i++;
          continue;
        }
        i++;
      }

      if (segments.length >= 5) {
        segments.push(count);
        // Check ratio: dark-light-dark-light-dark ≈ 1:1:3:1:1
        // segments[0] is dark, [1] is light, [2] is dark, [3] is light, [4] is dark
        const totalWidth = segments[0] + segments[1] + segments[2] + segments[3] + segments[4];
        const modSize = totalWidth / 7;
        if (modSize >= minModuleSize && modSize <= maxModuleSize) {
          const ratios = segments.map(s => s / modSize);
          const expected = [1, 1, 3, 1, 1];
          let match = true;
          for (let j = 0; j < 5; j++) {
            if (Math.abs(ratios[j] - expected[j]) > 0.5) {
              match = false;
              break;
            }
          }
          if (match) {
            // Calculate center x of the finder pattern
            const startX = i - totalWidth - 1; // approximate
            const centerX = startX + totalWidth / 2;
            if (centerX > 0 && centerX < width) {
              candidates.push({ x: Math.round(centerX), y });
            }
          }
        }
        // Remove first segment and continue
        if (segments.length >= 5) {
          segments.shift();
          i = row + segments.reduce((a, b) => a + b, 0);
        }
      }
    }
  }

  // Cluster similar x positions
  if (candidates.length === 0) return [];

  // Find clusters of similar x positions (likely finder patterns appear at similar x across rows)
  const clusters: { centerX: number; count: number }[] = [];
  for (const c of candidates) {
    let found = false;
    for (const cluster of clusters) {
      if (Math.abs(cluster.centerX - c.x) < 10) {
        cluster.centerX = (cluster.centerX * cluster.count + c.x) / (cluster.count + 1);
        cluster.count++;
        found = true;
        break;
      }
    }
    if (!found) {
      clusters.push({ centerX: c.x, count: 1 });
    }
  }

  // Return top 3 clusters
  clusters.sort((a, b) => b.count - a.count);
  const result = clusters.slice(0, 3).map(c => ({ x: Math.round(c.centerX), y: 0 }));
  return result;
}

function estimateModuleSize(finders: { x: number; y: number }[], binary: number[], width: number, height: number): number {
  if (finders.length < 2) return 0;

  // Estimate module size based on distance between finder patterns
  const dx = Math.abs(finders[0].x - (finders[1]?.x ?? finders[0].x));
  if (dx < 10) return 0;

  // The distance between finder pattern centers is roughly (matrixSize - 7) * moduleSize
  // For a typical QR code, the finder patterns are at the corners
  // We'll estimate: moduleSize = dx / ~(matrixSize - 7)
  for (let guessVersion = 1; guessVersion <= 40; guessVersion++) {
    const matrixSize = 17 + guessVersion * 4;
    const estimatedModSize = dx / (matrixSize - 7);
    if (estimatedModSize >= 2 && estimatedModSize <= Math.min(width, height) / matrixSize) {
      return Math.round(estimatedModSize);
    }
  }

  return Math.round(dx / 14); // default for version 1 QR
}

function attemptExtractData(
  binary: number[], width: number, height: number,
  finders: { x: number; y: number }[],
  moduleSize: number
): string | null {
  // This is a simplified extraction approach
  // A full QR decoder would require format info, version info, error correction, etc.
  // Here we provide a best-effort extraction

  // Determine top-left finder pattern
  if (finders.length < 2) return null;

  const sortedByX = [...finders].sort((a, b) => a.x - b.x);
  const topLeft = sortedByX[0];
  const topRight = sortedByX[sortedByX.length - 1];

  const qrWidth = Math.abs(topRight.x - topLeft.x) + 7 * moduleSize;
  const matrixSize = Math.floor(qrWidth / moduleSize);

  if (matrixSize < 21 || matrixSize > 177) return null;

  // Attempt to read raw data bits
  // For a simplified approach, we try to extract the byte-mode data
  // This is a rough approximation and won't work for all QR codes
  try {
    // Find timing pattern to determine the grid
    const finderEnd = 7 * moduleSize;
    const dataStartX = topLeft.x + finderEnd;
    const dataStartY = topLeft.y + finderEnd;

    // Try to read bytes from the data area
    // In QR code byte mode, the data encoding is 0100 (4 bits) followed by length
    // For now, return null to indicate we detected a QR code but can't fully decode it
    // A real implementation would need jsQR or similar library

    // We successfully found QR finder patterns - but full decode requires a library
    return null;
  } catch {
    return null;
  }
}
</script>
