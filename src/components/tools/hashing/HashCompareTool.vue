<template>
  <div class="space-y-4">
    <TextInput v-model="inputText" label="原始文本" placeholder="输入原始文本" :rows="3" show-count />

    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">哈希值</label>
      <input
        v-model="hashValue"
        type="text"
        placeholder="输入待验证的哈希值"
        class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none "
        
      />
    </div>

    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">哈希算法</label>
      <select
        v-model="algorithm"
        class="rounded-md border px-3 py-2 text-sm focus:outline-none "
        
      >
        <option value="MD5">MD5</option>
        <option value="SHA1">SHA-1</option>
        <option value="SHA256">SHA-256</option>
        <option value="SHA512">SHA-512</option>
        <option value="SHA3">SHA-3</option>
        <option value="RIPEMD160">RIPEMD-160</option>
      </select>
    </div>

    <div class="flex justify-end">
      <button
        @click="verify"
        :disabled="!inputText.trim() || !hashValue.trim()"
        class="btn-primary"
      >
        验证
      </button>
    </div>

    <div v-if="verified !== null" class="rounded-md border p-4 text-center" :style="verified ? 'border-color: #bbf7d0; background-color: #f0fdf4;' : 'border-color: #fecaca; background-color: #fef2f2;'">
      <div class="flex items-center justify-center gap-3">
        <svg v-if="verified" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <span class="text-lg font-medium" :style="verified ? 'color: #16a34a;' : 'color: #dc2626;'">
          {{ verified ? '匹配 - 哈希值一致' : '不匹配 - 哈希值不一致' }}
        </span>
      </div>
      <div v-if="computedHash" class="text-xs mt-2 font-mono" style="color: var(--color-text-muted);">
        计算值: {{ computedHash }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CryptoJS from 'crypto-js';
import TextInput from '../../common/TextInput.vue';

const inputText = ref('');
const hashValue = ref('');
const algorithm = ref('SHA256');
const verified = ref<boolean | null>(null);
const computedHash = ref('');

const algoMap: Record<string, any> = {
  MD5: CryptoJS.MD5,
  SHA1: CryptoJS.SHA1,
  SHA256: CryptoJS.SHA256,
  SHA512: CryptoJS.SHA512,
  SHA3: CryptoJS.SHA3,
  RIPEMD160: CryptoJS.RIPEMD160,
};

function verify() {
  const algo = algoMap[algorithm.value];
  if (!algo) return;

  const hash = algo(inputText.value).toString();
  computedHash.value = hash;

  // Compare case-insensitively
  verified.value = hash.toLowerCase() === hashValue.value.trim().toLowerCase();
}
</script>
