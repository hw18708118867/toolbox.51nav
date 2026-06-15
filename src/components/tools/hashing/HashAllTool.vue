<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要计算哈希的文本" :rows="4" show-count />
    <div class="flex items-center gap-4">
      <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
        <input type="checkbox" v-model="uppercase" />
        大写输出
      </label>
    </div>
    <div class="flex justify-end">
      <button @click="calculate" class="btn-primary">
        计算所有哈希
      </button>
    </div>

    <div v-if="results.length > 0" class="space-y-2">
      <div
        v-for="r in results"
        :key="r.name"
        class="flex items-center gap-3 rounded-md border px-3 py-2"
        style="background-color: var(--color-bg-tertiary); border-color: var(--color-border);"
      >
        <span class="text-xs font-medium shrink-0 w-20" style="color: var(--color-text-secondary);">{{ r.name }}</span>
        <code class="text-xs font-mono flex-1 break-all" style="color: var(--color-text);">{{ r.value }}</code>
        <CopyButton :text="r.value" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CryptoJS from 'crypto-js';
import TextInput from '../../common/TextInput.vue';
import CopyButton from '../../common/CopyButton.vue';

const input = ref('');
const uppercase = ref(false);
const results = ref<{ name: string; value: string }[]>([]);

function calculate() {
  const text = input.value;
  const fmt = (hash: string) => uppercase.value ? hash.toUpperCase() : hash;

  results.value = [
    { name: 'MD5', value: fmt(CryptoJS.MD5(text).toString()) },
    { name: 'SHA-1', value: fmt(CryptoJS.SHA1(text).toString()) },
    { name: 'SHA-224', value: fmt(CryptoJS.SHA224(text).toString()) },
    { name: 'SHA-256', value: fmt(CryptoJS.SHA256(text).toString()) },
    { name: 'SHA-384', value: fmt(CryptoJS.SHA384(text).toString()) },
    { name: 'SHA-512', value: fmt(CryptoJS.SHA512(text).toString()) },
    { name: 'SHA3-256', value: fmt(CryptoJS.SHA3(text, { outputLength: 256 }).toString()) },
    { name: 'SHA3-512', value: fmt(CryptoJS.SHA3(text, { outputLength: 512 }).toString()) },
    { name: 'RIPEMD-160', value: fmt(CryptoJS.RIPEMD160(text).toString()) },
  ];
}
</script>
