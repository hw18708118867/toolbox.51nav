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
          <TextOutput v-model="output" label="Ascii85 结果" :rows="6" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decodeInput" label="输入 Ascii85" placeholder="请输入要解码的 Ascii85 字符串" :rows="6" show-count />
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

function encode() {
  const bytes = new TextEncoder().encode(input.value);
  let result = '';
  for (let i = 0; i < bytes.length; i += 4) {
    let chunk = 0n;
    let count = 0;
    for (let j = 0; j < 4; j++) {
      chunk = (chunk << 8n) | BigInt(i + j < bytes.length ? bytes[i + j] : 0);
      if (i + j < bytes.length) count++;
    }
    if (count === 0) continue;
    // Special case: all zeros with 4 bytes = 'z'
    if (chunk === 0n && count === 4) {
      result += 'z';
      continue;
    }
    const encoded: string[] = [];
    const totalChars = count + 1;
    for (let j = totalChars - 1; j >= 0; j--) {
      encoded[j] = String.fromCharCode(Number(chunk % 85n) + 33);
      chunk = chunk / 85n;
    }
    result += encoded.join('');
  }
  output.value = result;
}

function decode() {
  error.value = '';
  try {
    let str = decodeInput.value.trim();
    // Remove whitespace and ~> markers
    str = str.replace(/~>$/g, '').replace(/\s/g, '');
    const bytes: number[] = [];
    let i = 0;
    while (i < str.length) {
      if (str[i] === 'z') {
        bytes.push(0, 0, 0, 0);
        i++;
        continue;
      }
      const groupSize = Math.min(5, str.length - i);
      let chunk = 0n;
      for (let j = 0; j < groupSize; j++) {
        const code = str[i + j].charCodeAt(0) - 33;
        if (code < 0 || code > 84) {
          error.value = '解码失败: 输入包含无效的 Ascii85 字符';
          decodeOutput.value = '';
          return;
        }
        chunk = chunk * 85n + BigInt(code);
      }
      // Padding: multiply by powers of 85 for missing chars
      for (let j = groupSize; j < 5; j++) {
        chunk = chunk * 85n + 84n;
      }
      const outputSize = groupSize - 1;
      for (let j = outputSize - 1; j >= 0; j--) {
        bytes.push(Number((chunk >> BigInt(j * 8)) & 0xffn));
      }
      i += groupSize;
    }
    decodeOutput.value = new TextDecoder().decode(new Uint8Array(bytes));
  } catch {
    error.value = '解码失败: 输入不是有效的 Ascii85 字符串';
    decodeOutput.value = '';
  }
}
</script>
