<template>
  <div class="space-y-4">
    <TabView :tabs="['编码', '解码']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="input" label="输入文本" placeholder="请输入要编码的文本（A-Z）" :rows="6" show-count />
          <div class="flex justify-end">
            <button @click="encode" class="btn-primary">
              编码
            </button>
          </div>
          <TextOutput v-model="output" label="敲击码" :rows="6" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decodeInput" label="输入敲击码" placeholder="请输入敲击码（用 row.column 格式，组间用空格分隔）" :rows="6" show-count />
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

// Standard 5x5 Polybius square: C and K share a cell
// Row indices: 1-5, Column indices: 1-5
const TAP_TABLE = [
  ['A', 'B', 'C', 'D', 'E'],
  ['F', 'G', 'H', 'I', 'J'],
  ['L', 'M', 'N', 'O', 'P'],
  ['Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z'],
];

// Build lookup: letter -> [row, col] (1-indexed)
const TAP_ENCODE: Record<string, string> = {};
// Build lookup: "row.col" -> letter
const TAP_DECODE: Record<string, string> = {};

// Note: K maps to same position as C
TAP_ENCODE['K'] = '1.3';

for (let r = 0; r < 5; r++) {
  for (let c = 0; c < 5; c++) {
    const letter = TAP_TABLE[r][c];
    const code = `${r + 1}.${c + 1}`;
    TAP_ENCODE[letter] = code;
    TAP_DECODE[code] = letter;
  }
}

function encode() {
  const text = input.value.toUpperCase();
  const result: string[] = [];
  for (const ch of text) {
    if (ch >= 'A' && ch <= 'Z') {
      if (ch === 'K') {
        result.push(TAP_ENCODE['C']); // K maps to C position
      } else {
        result.push(TAP_ENCODE[ch] || '?.?');
      }
    } else if (ch === ' ') {
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
    // Split by spaces and slashes
    const tokens = text.split(/\s+/);
    const result: string[] = [];
    for (const token of tokens) {
      if (token === '/') {
        result.push(' ');
        continue;
      }
      // Parse "row.column" format - also support "row col" without dot
      let code = token;
      if (token.length >= 3 && !token.includes('.')) {
        // e.g., "13" -> "1.3"
        const r = token[0];
        const c = token.substring(1);
        code = `${r}.${c}`;
      }
      const letter = TAP_DECODE[code];
      if (letter) {
        result.push(letter);
      } else {
        result.push('?');
      }
    }
    decodeOutput.value = result.join('');
  } catch {
    error.value = '解码失败: 输入格式不正确，请使用 row.column 格式';
    decodeOutput.value = '';
  }
}
</script>
