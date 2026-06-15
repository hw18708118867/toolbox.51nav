<template>
  <div class="space-y-4">
    <TabView :tabs="['编码', '解码']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="input" label="输入文本" placeholder="请输入要编码的文本（A-Z, 0-9）" :rows="6" show-count />
          <div class="flex justify-end">
            <button @click="encode" class="btn-primary">
              编码为盲文
            </button>
          </div>
          <TextOutput v-model="output" label="布莱叶盲文" :rows="6" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decodeInput" label="输入盲文" placeholder="请输入盲文字符（Unicode U+2800 范围）" :rows="6" show-count />
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

// Standard English Braille mapping (Unicode Braille patterns)
// Each braille cell has 6 dots (numbered 1-6: top-left=1, mid-left=2, bottom-left=3,
// top-right=4, mid-right=5, bottom-right=6)
// The dot pattern maps to Unicode offset from U+2800

const BRAILLE_MAP: Record<string, number> = {
  'A': 0x01, // dot 1
  'B': 0x03, // dots 1-2
  'C': 0x09, // dots 1-4
  'D': 0x19, // dots 1-4-5
  'E': 0x11, // dots 1-5
  'F': 0x0B, // dots 1-2-4
  'G': 0x1B, // dots 1-2-4-5
  'H': 0x13, // dots 1-2-5
  'I': 0x0A, // dots 2-4
  'J': 0x1A, // dots 2-4-5
  'K': 0x05, // dots 1-3
  'L': 0x07, // dots 1-2-3
  'M': 0x0D, // dots 1-3-4
  'N': 0x1D, // dots 1-3-4-5
  'O': 0x15, // dots 1-3-5
  'P': 0x0F, // dots 1-2-3-4
  'Q': 0x1F, // dots 1-2-3-4-5
  'R': 0x17, // dots 1-2-3-5
  'S': 0x0E, // dots 2-3-4
  'T': 0x1E, // dots 2-3-4-5
  'U': 0x25, // dots 1-3-6
  'V': 0x27, // dots 1-2-3-6
  'W': 0x3A, // dots 2-4-5-6
  'X': 0x2D, // dots 1-3-4-6
  'Y': 0x3D, // dots 1-3-4-5-6
  'Z': 0x35, // dots 1-3-5-6
  // Digits (Braille number indicator is usually prefix, but here we map 0-9)
  '1': 0x01, // same as A, but with number sign context
  '2': 0x03, // same as B
  '3': 0x09, // same as C
  '4': 0x19, // same as D
  '5': 0x11, // same as E
  '6': 0x0B, // same as F
  '7': 0x1B, // same as G
  '8': 0x13, // same as H
  '9': 0x0A, // same as I
  '0': 0x1A, // same as J
  // Punctuation
  '.': 0x32, // dots 2-5-6
  ',': 0x02, // dot 2
  '?': 0x26, // dots 2-3-6
  '!': 0x16, // dots 2-3-5
  "'": 0x04, // dot 3
  '-': 0x24, // dots 3-6
  ';': 0x06, // dots 2-3
  ':': 0x12, // dots 2-5
  '(': 0x36, // dots 2-3-5-6
  ')': 0x36, // same as open paren
  '/': 0x0C, // dots 3-4
  ' ': 0x00, // blank
};

const REVERSE_BRAILLE: Record<number, string> = {};
for (const [char, pattern] of Object.entries(BRAILLE_MAP)) {
  if (!REVERSE_BRAILLE[pattern]) {
    REVERSE_BRAILLE[pattern] = char;
  }
}

function encode() {
  const text = input.value.toUpperCase();
  let result = '';
  let inNumber = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch >= '0' && ch <= '9') {
      if (!inNumber) {
        // Add number sign (dots 3-4-5-6 = 0x3C)
        result += String.fromCodePoint(0x2800 + 0x3C);
        inNumber = true;
      }
      const pattern = BRAILLE_MAP[ch] ?? 0x00;
      result += String.fromCodePoint(0x2800 + pattern);
    } else {
      inNumber = false;
      const pattern = BRAILLE_MAP[ch];
      if (pattern !== undefined) {
        result += String.fromCodePoint(0x2800 + pattern);
      } else if (ch >= 'A' && ch <= 'Z') {
        // Unknown letter: show as-is
        result += ch;
      }
    }
  }
  output.value = result;
}

function decode() {
  error.value = '';
  try {
    const text = decodeInput.value;
    let result = '';
    let numberMode = false;
    for (const ch of text) {
      const code = ch.codePointAt(0) ?? 0;
      if (code >= 0x2800 && code <= 0x28FF) {
        const pattern = code - 0x2800;
        // Number sign
        if (pattern === 0x3C) {
          numberMode = true;
          continue;
        }
        const mapped = REVERSE_BRAILLE[pattern];
        if (mapped) {
          if (numberMode) {
            // Convert letters A-J to digits 1-9,0
            const digitMap: Record<string, string> = {
              'A': '1', 'B': '2', 'C': '3', 'D': '4', 'E': '5',
              'F': '6', 'G': '7', 'H': '8', 'I': '9', 'J': '0',
            };
            result += digitMap[mapped] || mapped;
          } else {
            result += mapped;
          }
        } else {
          result += '?';
        }
        // Reset number mode on space
        if (pattern === 0x00) {
          numberMode = false;
        }
      } else if (ch === ' ' || ch === '\n') {
        result += ch;
        numberMode = false;
      } else {
        result += ch;
        numberMode = false;
      }
    }
    decodeOutput.value = result;
  } catch {
    error.value = '解码失败: 输入包含无效的盲文字符';
    decodeOutput.value = '';
  }
}
</script>
