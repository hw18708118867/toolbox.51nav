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
          <TextOutput v-model="output" label="Base32 结果" :rows="6" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decodeInput" label="输入 Base32" placeholder="请输入要解码的 Base32 字符串" :rows="6" show-count />
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

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function encode() {
  const data = new TextEncoder().encode(input.value);
  const bits: number[] = [];
  for (let i = 0; i < data.length; i++) {
    for (let j = 7; j >= 0; j--) {
      bits.push((data[i] >> j) & 1);
    }
  }
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    let value = 0;
    for (let j = 0; j < 5; j++) {
      value = (value << 1) | (bits[i + j] !== undefined ? bits[i + j] : 0);
    }
    result += BASE32_ALPHABET[value];
  }
  const padding = (8 - (result.length % 8)) % 8;
  for (let i = 0; i < padding; i++) {
    result += '=';
  }
  output.value = result;
}

function decode() {
  error.value = '';
  try {
    let str = decodeInput.value.trim().toUpperCase().replace(/=+$/, '');
    if (!/^[A-Z2-7]*$/.test(str)) {
      error.value = '解码失败: 输入包含无效的 Base32 字符';
      decodeOutput.value = '';
      return;
    }
    const bits: number[] = [];
    for (let i = 0; i < str.length; i++) {
      const value = BASE32_ALPHABET.indexOf(str[i]);
      if (value === -1) continue;
      for (let j = 4; j >= 0; j--) {
        bits.push((value >> j) & 1);
      }
    }
    const bytes: number[] = [];
    for (let i = 0; i + 7 < bits.length; i += 8) {
      let value = 0;
      for (let j = 0; j < 8; j++) {
        value = (value << 1) | bits[i + j];
      }
      bytes.push(value);
    }
    decodeOutput.value = new TextDecoder().decode(new Uint8Array(bytes));
  } catch {
    error.value = '解码失败: 输入不是有效的 Base32 字符串';
    decodeOutput.value = '';
  }
}
</script>
