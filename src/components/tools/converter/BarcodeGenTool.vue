<template>
  <div class="space-y-4">
    <TextInput v-model="barcodeText" label="条码内容" :placeholder="placeholderText" :rows="2" />

    <div>
      <label class="text-xs font-medium block mb-1.5" style="color: var(--color-text-secondary);">条码类型</label>
      <select
        v-model="barcodeType"
        class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "

      >
        <option value="code128">Code 128</option>
        <option value="ean13">EAN-13</option>
        <option value="upca">UPC-A</option>
      </select>
    </div>

    <div class="flex justify-end">
      <button
        @click="generate"
        :disabled="!barcodeText.trim()"
        class="btn-primary"
      >
        生成条码
      </button>
    </div>

    <ErrorAlert :message="error" />

    <div v-if="generated" class="rounded-md border p-6 space-y-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
      <div class="rounded-md p-4" style="background-color: white;">
        <canvas ref="barcodeCanvasRef" class="mx-auto" :width="canvasWidth" :height="200"></canvas>
      </div>
      <div class="flex justify-center gap-2">
        <button @click="downloadPNG" class="btn-primary">下载 PNG</button>
        <CopyButton :text="barcodeText" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import TextInput from '../../common/TextInput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';
import CopyButton from '../../common/CopyButton.vue';

const barcodeText = ref('');
const barcodeType = ref('code128');
const error = ref('');
const generated = ref(false);
const barcodeCanvasRef = ref<HTMLCanvasElement>();
const canvasWidth = ref(400);

const placeholderText = computed(() => {
  switch (barcodeType.value) {
    case 'ean13': return '输入 12 位数字（校验位自动计算）';
    case 'upca': return '输入 11 位数字（校验位自动计算）';
    default: return '输入任意字符（ASCII）';
  }
});

// ====== Code 128 Encoding (Code 128B) ======
const code128BSwitch = 104; // Start Code B
const code128Stop = 106;

function encodeCode128B(text: string): { pattern: number[]; checkDigit: number } {
  const patterns: number[] = [code128BSwitch];
  let sum = code128BSwitch; // start code contributes its own index

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 32 || code > 126) {
      throw new Error('Code 128B 只支持 ASCII 32-126 的字符');
    }
    const value = code - 32;
    patterns.push(value);
    sum += value * (i + 1);
  }

  const checkDigit = sum % 103;
  patterns.push(checkDigit);
  patterns.push(code128Stop);

  return { pattern: patterns, checkDigit };
}

// Code 128 bar patterns (value -> 11-module bar/space sequence; 1=bar, 0=space)
// Each pattern is represented as the width sequence (e.g., [2,1,2,2,2,2] means 2-wide bar, 1-wide space, etc.)
const code128Patterns: number[][] = [
  [2,1,2,2,2,2], [2,2,2,1,2,2], [2,2,2,2,2,1], [1,2,1,2,2,3], [1,2,1,3,2,2],
  [1,3,1,2,2,2], [1,2,2,2,1,3], [1,2,2,3,1,2], [1,3,2,2,1,2], [2,2,1,2,1,3],
  [2,2,1,3,1,2], [2,3,1,2,1,2], [1,1,2,2,3,2], [1,2,2,1,3,2], [1,2,2,2,3,1],
  [1,1,3,2,2,2], [1,2,3,1,2,2], [1,2,3,2,2,1], [2,2,3,2,1,1], [2,2,1,1,3,2],
  [2,2,1,2,3,1], [2,1,3,2,1,2], [2,2,3,1,1,2], [3,1,2,1,3,1], [3,1,1,2,2,2],
  [3,2,1,1,2,2], [3,2,1,2,2,1], [3,1,2,2,1,2], [3,2,2,1,1,2], [3,2,2,2,1,1],
  [2,1,2,1,2,3], [2,1,2,3,2,1], [2,3,2,1,2,1], [1,1,1,3,2,3], [1,3,1,1,2,3],
  [1,3,1,3,2,1], [1,1,2,3,1,3], [1,3,2,1,1,3], [1,3,2,3,1,1], [2,1,1,3,1,3],
  [2,3,1,1,1,3], [2,3,1,3,1,1], [1,1,2,1,3,3], [1,1,2,3,3,1], [1,3,2,1,3,1],
  [1,1,3,1,2,3], [1,1,3,3,2,1], [1,3,3,1,2,1], [3,1,3,1,2,1], [2,1,1,3,3,1],
  [2,3,1,1,3,1], [2,1,3,1,1,3], [2,1,3,3,1,1], [2,1,3,1,3,1], [3,1,1,1,2,3],
  [3,1,1,3,2,1], [3,3,1,1,2,1], [3,1,2,1,1,3], [3,1,2,3,1,1], [3,3,2,1,1,1],
  [3,1,4,1,1,1], [2,2,1,4,1,1], [4,3,1,1,1,1], [1,1,1,2,2,4], [1,1,1,4,2,2],
  [1,2,1,1,2,4], [1,2,1,4,2,1], [1,4,1,1,2,2], [1,4,1,2,2,1], [1,1,2,2,1,4],
  [1,1,2,4,1,2], [1,2,2,1,1,4], [1,2,2,4,1,1], [1,4,2,1,1,2], [1,4,2,2,1,1],
  [2,4,1,2,1,1], [2,2,1,1,1,4], [4,1,3,1,1,1], [2,4,1,1,1,2], [1,3,4,1,1,1],
  [1,1,1,2,4,2], [1,2,1,1,4,2], [1,2,1,2,4,1], [1,1,4,2,1,2], [1,2,4,1,1,2],
  [1,2,4,2,1,1], [4,1,1,2,1,2], [4,2,1,1,1,2], [4,2,1,2,1,1], [2,1,2,1,4,1],
  [2,1,4,1,2,1], [4,1,2,1,2,1], [1,1,1,1,4,3], [1,1,1,3,4,1], [1,3,1,1,4,1],
  [1,1,4,1,1,3], [1,1,4,3,1,1], [4,1,1,1,1,3], [4,1,1,3,1,1], [1,1,3,1,4,1],
  [1,1,4,1,3,1], [3,1,1,1,4,1], [4,1,1,1,3,1], [2,1,1,4,1,2], [2,1,1,2,1,4],
  [2,1,1,2,3,2], // stop pattern: 2,3,3,1,1,1,2
];

function drawCode128Bars(ctx: CanvasRenderingContext2D, patterns: number[], x: number, barHeight: number, scale: number, isBar: boolean) {
  for (let i = 0; i < patterns.length; i++) {
    const width = patterns[i] * scale;
    if (isBar) {
      ctx.fillRect(x, 0, width, barHeight);
    }
    x += width;
    isBar = !isBar;
  }
  return x;
}

// ====== EAN-13 / UPC-A Encoding ======
const eanLPatterns: Record<string, number[][]> = {
  '0': [[0,0,0,1,1,0,1]],
  '1': [[0,0,1,1,0,0,1]],
  '2': [[0,0,1,0,0,1,1]],
  '3': [[0,1,1,1,1,0,1]],
  '4': [[0,1,0,0,0,1,1]],
  '5': [[0,1,1,0,0,0,1]],
  '6': [[0,1,0,1,1,1,1]],
  '7': [[0,1,1,1,0,1,1]],
  '8': [[0,1,1,0,1,1,1]],
  '9': [[0,0,0,1,0,1,1]],
};

const eanGPatterns: Record<string, number[][]> = {
  '0': [[0,1,0,0,1,1,1]],
  '1': [[0,1,1,0,0,1,1]],
  '2': [[0,0,1,1,0,1,1]],
  '3': [[0,1,0,0,0,0,1]],
  '4': [[0,0,1,1,1,0,1]],
  '5': [[0,1,1,1,0,0,1]],
  '6': [[0,0,0,0,1,0,1]],
  '7': [[0,0,1,0,0,0,1]],
  '8': [[0,0,0,1,0,0,1]],
  '9': [[0,0,1,0,1,1,1]],
};

const eanRPatterns: Record<string, number[][]> = {
  '0': [[1,1,1,0,0,1,0]],
  '1': [[1,1,0,0,1,1,0]],
  '2': [[1,1,0,1,1,0,0]],
  '3': [[1,0,0,0,0,1,0]],
  '4': [[1,0,1,1,1,0,0]],
  '5': [[1,0,0,1,1,1,0]],
  '6': [[1,0,1,0,0,0,0]],
  '7': [[1,0,0,0,1,0,0]],
  '8': [[1,0,0,1,0,0,0]],
  '9': [[1,1,1,0,1,0,0]],
};

const eanParityTable: Record<string, string> = {
  '0': 'LLLLLL', '1': 'LLGLGG', '2': 'LLGGLG', '3': 'LLGGGL',
  '4': 'LGLLGG', '5': 'LGGLLG', '6': 'LGGGLL', '7': 'LGLGLG',
  '8': 'LGLGGL', '9': 'LGGLGL',
};

function calcEAN13CheckDigit(digits: string): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

function drawEAN13Bars(ctx: CanvasRenderingContext2D, data: string, x: number, barHeight: number, scale: number): number {
  const startGuard = [1,0,1];
  const middleGuard = [0,1,0,1,0];
  const endGuard = [1,0,1];

  const firstDigit = data[0];
  const leftDigits = data.slice(1, 7);
  const rightDigits = data.slice(7);
  const parity = eanParityTable[firstDigit];

  // Start guard
  x = drawGuard(ctx, startGuard, x, barHeight, scale);

  // Left half
  for (let i = 0; i < 6; i++) {
    const digit = leftDigits[i];
    const enc = parity[i] === 'L'
      ? eanLPatterns[digit][0]
      : eanGPatterns[digit][0];
    x = drawDigit(ctx, enc, x, barHeight, scale);
  }

  // Middle guard
  x = drawGuard(ctx, middleGuard, x, barHeight, scale);

  // Right half
  for (let i = 0; i < 6; i++) {
    const digit = rightDigits[i];
    x = drawDigit(ctx, eanRPatterns[digit][0], x, barHeight, scale);
  }

  // End guard
  x = drawGuard(ctx, endGuard, x, barHeight, scale);

  return x;
}

function drawDigit(ctx: CanvasRenderingContext2D, pattern: number[], x: number, barHeight: number, scale: number): number {
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === 1) {
      ctx.fillRect(x, 0, scale, barHeight);
    }
    x += scale;
  }
  return x;
}

function drawGuard(ctx: CanvasRenderingContext2D, pattern: number[], x: number, barHeight: number, scale: number): number {
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === 1) {
      ctx.fillRect(x, 0, scale, barHeight);
    }
    x += scale;
  }
  return x;
}

// ====== Main Draw ======
function drawOnCanvas(ctx: CanvasRenderingContext2D, text: string, type: string, width: number) {
  ctx.clearRect(0, 0, width, 200);

  const barHeight = 150;
  const moduleWidth = 2;
  const barStartY = 30;

  ctx.save();
  ctx.translate(40, barStartY);

  let totalWidth: number;

  if (type === 'code128') {
    const { pattern } = encodeCode128B(text);
    let x = 0;
    let isBar = true;
    for (const p of pattern) {
      const widths = code128Patterns[p];
      if (!widths) continue;
      for (let i = 0; i < widths.length; i++) {
        const w = widths[i] * moduleWidth;
        if (isBar) {
          ctx.fillRect(x, 0, w, barHeight);
        }
        x += w;
        isBar = !isBar;
      }
    }
    // Terminal bar
    ctx.fillRect(x, 0, moduleWidth * 2, barHeight);
    totalWidth = x + moduleWidth * 2;
  } else if (type === 'ean13') {
    let digits = text.replace(/[^0-9]/g, '');
    if (digits.length === 12) {
      const cd = calcEAN13CheckDigit(digits);
      digits = digits + cd.toString();
    } else if (digits.length !== 13) {
      throw new Error('EAN-13 需要 12 或 13 位数字');
    } else {
      // validate check digit
      const checkDigit = calcEAN13CheckDigit(digits.slice(0, 12));
      if (checkDigit !== parseInt(digits[12])) {
        digits = digits.slice(0, 12) + checkDigit.toString();
      }
    }
    totalWidth = drawEAN13Bars(ctx, digits, 0, barHeight, moduleWidth);
  } else if (type === 'upca') {
    let digits = text.replace(/[^0-9]/g, '');
    if (digits.length === 11) {
      const cd = calcEAN13CheckDigit('0' + digits);
      digits = digits + cd.toString();
    } else if (digits.length !== 12) {
      throw new Error('UPC-A 需要 11 或 12 位数字');
    } else {
      const checkDigit = calcEAN13CheckDigit('0' + digits.slice(0, 11));
      if (checkDigit !== parseInt(digits[11])) {
        digits = digits.slice(0, 11) + checkDigit.toString();
      }
    }
    // UPC-A is EAN-13 with leading 0
    const eanData = '0' + digits;
    totalWidth = drawEAN13Bars(ctx, eanData, 0, barHeight, moduleWidth);
  } else {
    totalWidth = 0;
  }

  ctx.restore();

  canvasWidth.value = Math.max(400, totalWidth + 80);

  // Draw text label below bars
  let displayText = text;
  if (type === 'ean13') {
    displayText = text.replace(/[^0-9]/g, '');
    if (displayText.length === 12) displayText += calcEAN13CheckDigit(displayText);
  } else if (type === 'upca') {
    displayText = text.replace(/[^0-9]/g, '');
    if (displayText.length === 11) displayText += calcEAN13CheckDigit('0' + displayText);
  }
  ctx.fillStyle = '#000';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(displayText, width / 2, 190);
}

// ====== Actions ======
async function generate() {
  error.value = '';
  generated.value = false;

  if (!barcodeText.value.trim()) {
    error.value = '请输入条码内容';
    return;
  }

  await nextTick();

  const canvas = barcodeCanvasRef.value;
  if (!canvas) {
    error.value = '无法获取画布';
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    error.value = '无法获取画布上下文';
    return;
  }

  try {
    drawOnCanvas(ctx, barcodeText.value.trim(), barcodeType.value, 400);
    generated.value = true;
  } catch (e: any) {
    error.value = e.message || '生成条码失败';
    generated.value = false;
  }
}

function downloadPNG() {
  const canvas = barcodeCanvasRef.value;
  if (!canvas) return;
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `barcode_${barcodeType.value}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
</script>
