<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要计算 HMAC 的文本" :rows="4" show-count />
    <div class="space-y-2">
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">密钥 (Key)</label>
      <input
        v-model="key"
        type="text"
        placeholder="请输入密钥"
        class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
        
      />
    </div>
    <div class="flex items-center gap-4">
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">哈希算法</label>
      <select
        v-model="algorithm"
        class="rounded-md border px-3 py-1.5 text-sm focus:outline-none "
        
      >
        <option value="MD5">MD5</option>
        <option value="SHA1">SHA-1</option>
        <option value="SHA256">SHA-256</option>
        <option value="SHA512">SHA-512</option>
      </select>
      <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
        <input type="checkbox" v-model="uppercase" />
        大写输出
      </label>
    </div>
    <div class="flex justify-end">
      <button @click="calculate" class="btn-primary">
        计算 HMAC
      </button>
    </div>
    <TextOutput v-model="output" label="HMAC 结果" :rows="3" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CryptoJS from 'crypto-js';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const key = ref('');
const algorithm = ref('SHA256');
const output = ref('');
const uppercase = ref(false);

function calculate() {
  const algo = CryptoJS[algorithm.value as keyof typeof CryptoJS] as any;
  const hash = CryptoJS.HmacSHA256(input.value, key.value);
  const result = hash.toString();
  output.value = uppercase.value ? result.toUpperCase() : result;
}
</script>
