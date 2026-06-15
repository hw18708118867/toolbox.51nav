<template>
  <div class="space-y-4">
    <TabView :tabs="['编码', '解码']">
      <template #tab-0>
        <div class="space-y-4">
          <TextInput v-model="encodeInput" label="输入文本" placeholder="请输入要编码的文本" :rows="8" show-count />
          <div class="flex justify-end">
            <button @click="encode" class="btn-primary">编码</button>
          </div>
          <TextOutput v-model="encodeOutput" label="Quoted-Printable 编码结果" :rows="8" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-4">
          <TextInput v-model="decodeInput" label="输入 Quoted-Printable" placeholder="请输入 Quoted-Printable 编码的文本" :rows="8" show-count />
          <div class="flex justify-end">
            <button @click="decode" class="btn-primary">解码</button>
          </div>
          <ErrorAlert :message="error" />
          <TextOutput v-model="decodeOutput" label="解码结果" :rows="8" />
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

const encodeInput = ref('');
const encodeOutput = ref('');

const decodeInput = ref('');
const decodeOutput = ref('');
const error = ref('');

function encode() {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(encodeInput.value);
  // QP encoding: printable ASCII except = stays as-is, others become =XX
  const lines: string[] = [];
  let line = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    let encoded: string;
    if (b === 0x09 || b === 0x20) {
      // tab and space are printable
      encoded = String.fromCodePoint(b);
    } else if (b >= 33 && b <= 60 || b >= 62 && b <= 126) {
      // printable ASCII except =
      encoded = String.fromCodePoint(b);
    } else {
      encoded = '=' + b.toString(16).toUpperCase().padStart(2, '0');
    }
    if (line.length + encoded.length > 75) {
      lines.push(line + '=');
      line = '';
    }
    line += encoded;
  }
  if (line) lines.push(line);
  encodeOutput.value = lines.join('\r\n');
}

function decode() {
  error.value = '';
  try {
    let text = decodeInput.value.replace(/\r\n|\r|\n/g, '\n');
    // Remove soft line breaks
    text = text.replace(/=\n/g, '');
    // Decode =XX
    text = text.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
      return String.fromCodePoint(parseInt(hex, 16));
    });
    decodeOutput.value = text;
  } catch {
    error.value = '解码失败: 输入无效';
    decodeOutput.value = '';
  }
}
</script>
