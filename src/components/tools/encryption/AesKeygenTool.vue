<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">密钥长度</label>
        <select
          v-model="keySize"
          class="rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        >
          <option :value="128">128 位 (16 字节)</option>
          <option :value="192">192 位 (24 字节)</option>
          <option :value="256">256 位 (32 字节)</option>
        </select>
      </div>
      <div class="pt-4">
        <button
          @click="generate"
          class="btn-primary"
        >
          生成
        </button>
      </div>
    </div>

    <div v-if="keyHex" class="space-y-2">
      <div class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-medium" style="color: var(--color-text-secondary);">AES {{ keySize }} 位密钥 (HEX)</span>
          <CopyButton :text="keyHex" />
        </div>
        <code class="text-sm font-mono break-all" style="color: var(--color-text);">{{ keyHex }}</code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const keySize = ref(256);
const keyHex = ref('');

function generate() {
  const byteLen = keySize.value / 8;
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  keyHex.value = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
</script>
