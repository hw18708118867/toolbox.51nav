<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要计算 RIPEMD-160 哈希的文本" :rows="5" show-count />
    <div class="flex items-center gap-4">
      <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
        <input type="checkbox" v-model="uppercase" />
        大写输出
      </label>
    </div>
    <div class="flex justify-end">
      <button @click="calculate" class="btn-primary">
        计算 RIPEMD-160
      </button>
    </div>
    <TextOutput v-model="output" label="RIPEMD-160 哈希值" :rows="2" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CryptoJS from 'crypto-js';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');
const uppercase = ref(false);

function calculate() {
  const hash = CryptoJS.RIPEMD160(input.value).toString();
  output.value = uppercase.value ? hash.toUpperCase() : hash;
}
</script>
