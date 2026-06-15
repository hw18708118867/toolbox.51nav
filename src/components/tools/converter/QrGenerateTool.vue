<template>
  <div class="space-y-4">
    <div class="space-y-3">
      <TextInput v-model="text" label="输入内容" placeholder="请输入要编码的文本或 URL" :rows="3" />

      <div class="flex gap-4">
        <div class="flex-1">
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">尺寸</label>
          <select
            v-model="size"
            class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
            
          >
            <option v-for="s in sizes" :key="s" :value="s">{{ s }} x {{ s }}</option>
          </select>
        </div>
        <div class="flex-1">
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">容错等级</label>
          <select
            v-model="errorLevel"
            class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
            
          >
            <option value="L">L (7%)</option>
            <option value="M">M (15%)</option>
            <option value="Q">Q (25%)</option>
            <option value="H">H (30%)</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end">
        <button
          @click="generate"
          :disabled="!text.trim() || generating"
          class="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          生成二维码
        </button>
      </div>
    </div>

    <div v-if="generating" class="flex items-center justify-center py-8">
      <svg class="animate-spin h-6 w-6" style="color: var(--color-primary);" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span class="ml-2 text-sm" style="color: var(--color-text-muted);">生成中...</span>
    </div>

    <div v-if="error" class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm" style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <div v-if="qrDataUrl" class="flex flex-col items-center gap-3">
      <div class="rounded-md border p-4" style="background-color: white; border-color: var(--color-border);">
        <img :src="qrDataUrl" :width="size" :height="size" alt="QR Code" />
      </div>
      <button
        @click="download"
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors border"
        style="background-color: var(--color-bg-secondary); color: var(--color-text); border-color: var(--color-border);"
      >
        下载 PNG
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';

const sizes = [128, 256, 512];
const text = ref('');
const size = ref(256);
const errorLevel = ref('M');
const qrDataUrl = ref('');
const generating = ref(false);
const error = ref('');

async function generate() {
  if (!text.value.trim()) return;

  generating.value = true;
  error.value = '';
  qrDataUrl.value = '';

  try {
    const QRCode = await import('qrcode');
    qrDataUrl.value = await QRCode.toDataURL(text.value, {
      width: size.value,
      margin: 2,
      errorCorrectionLevel: errorLevel.value as 'L' | 'M' | 'Q' | 'H',
    });
  } catch (e: any) {
    error.value = e.message || '生成二维码失败';
  } finally {
    generating.value = false;
  }
}

function download() {
  if (!qrDataUrl.value) return;
  const link = document.createElement('a');
  link.download = 'qrcode.png';
  link.href = qrDataUrl.value;
  link.click();
}
</script>
