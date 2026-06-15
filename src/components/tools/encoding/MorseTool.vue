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
          <TextOutput v-model="output" label="摩尔斯电码" :rows="6" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decodeInput" label="输入摩尔斯电码" placeholder="请输入摩尔斯电码（用 . 和 - 表示，字母间用空格分隔，单词间用 / 分隔）" :rows="6" show-count />
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

const MORSE_MAP: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
  'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
  'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
  'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
  'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
  'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.',
};

const REVERSE_MAP: Record<string, string> = {};
for (const [char, code] of Object.entries(MORSE_MAP)) {
  REVERSE_MAP[code] = char;
}

function encode() {
  const text = input.value.toUpperCase();
  const result: string[] = [];
  for (const ch of text) {
    if (MORSE_MAP[ch]) {
      result.push(MORSE_MAP[ch]);
    } else if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') {
      result.push('/');
    }
  }
  output.value = result.join(' ');
}

function decode() {
  error.value = '';
  try {
    const text = decodeInput.value.trim();
    if (!text) {
      decodeOutput.value = '';
      return;
    }
    const words = text.split('/');
    const result: string[] = [];
    for (const word of words) {
      const letters = word.trim().split(/\s+/);
      for (const letter of letters) {
        if (letter === '') continue;
        if (REVERSE_MAP[letter]) {
          result.push(REVERSE_MAP[letter]);
        } else {
          result.push('?');
        }
      }
    }
    decodeOutput.value = result.join('');
  } catch {
    error.value = '解码失败: 无法解析摩尔斯电码';
    decodeOutput.value = '';
  }
}
</script>
