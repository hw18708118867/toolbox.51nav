<template>
  <div class="space-y-4">
    <TabView :tabs="['编码', '解码']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="input" label="输入文本" placeholder="请输入要编码的文本" :rows="6" show-count />
          <div class="flex justify-end">
            <button @click="encode" class="btn-primary">
              编码
            </button>
          </div>
          <TextOutput v-model="output" label="Base58 结果" :rows="6" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decodeInput" label="输入 Base58" placeholder="请输入要解码的 Base58 字符串" :rows="6" show-count />
          <div class="flex justify-end">
            <button @click="decode" class="btn-primary">
              解码
            </button>
          </div>
          <ErrorAlert :message="error" />
          <TextOutput v-model="decodeOutput" label="解码结果" :rows="6" />
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import TabView from '../../common/TabView.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const input = ref('');
const output = ref('');
const decodeInput = ref('');
const decodeOutput = ref('');
const error = ref('');

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encode() {
  const bytes = new TextEncoder().encode(input.value);
  let num = 0n;
  for (let i = 0; i < bytes.length; i++) {
    num = (num << 8n) | BigInt(bytes[i]);
  }
  if (num === 0n) {
    output.value = BASE58_ALPHABET[0];
    return;
  }
  let result = '';
  const base = 58n;
  while (num > 0n) {
    const remainder = Number(num % base);
    result = BASE58_ALPHABET[remainder] + result;
    num = num / base;
  }
  // Handle leading zeros
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = BASE58_ALPHABET[0] + result;
  }
  output.value = result;
}

function decode() {
  error.value = '';
  try {
    const str = decodeInput.value.trim();
    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(str)) {
      error.value = '解码失败: 输入包含无效的 Base58 字符';
      decodeOutput.value = '';
      return;
    }
    let num = 0n;
    const base = 58n;
    for (let i = 0; i < str.length; i++) {
      const value = BASE58_ALPHABET.indexOf(str[i]);
      if (value === -1) {
        error.value = '解码失败: 输入包含无效的 Base58 字符';
        decodeOutput.value = '';
        return;
      }
      num = num * base + BigInt(value);
    }
    // Count leading '1's
    let leadingZeros = 0;
    for (let i = 0; i < str.length && str[i] === '1'; i++) {
      leadingZeros++;
    }
    // Convert BigInt to bytes
    const bytes: number[] = [];
    let temp = num;
    while (temp > 0n) {
      bytes.unshift(Number(temp & 0xffn));
      temp = temp >> 8n;
    }
    // Add leading zero bytes
    for (let i = 0; i < leadingZeros; i++) {
      bytes.unshift(0);
    }
    decodeOutput.value = new TextDecoder().decode(new Uint8Array(bytes));
  } catch {
    error.value = '解码失败: 输入不是有效的 Base58 字符串';
    decodeOutput.value = '';
  }
}
</script>
