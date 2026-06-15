<template>
  <div class="space-y-4">
    <TabView :tabs="['编码', '解码']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="input" label="输入文本" placeholder="请输入要编码的文本" :rows="6" show-count />
          <div class="flex justify-end">
            <button @click="encode" class="btn-primary">
              Aaencode 编码
            </button>
          </div>
          <TextOutput v-model="output" label="颜文字编码结果" :rows="8" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decodeInput" label="输入颜文字编码" placeholder="请输入要解码的颜文字编码" :rows="6" show-count />
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

// Unicode lookalike mapping for characters
const LOOKALIKE_MAP: Record<string, string> = {
  'a': 'ɑ', 'b': 'ƀ', 'c': 'с', 'd': 'ԁ',
  'e': 'е', 'f': 'ғ', 'g': 'ġ', 'h': 'һ',
  'i': 'і', 'j': 'ј', 'k': 'к', 'l': 'ⅼ',
  'm': 'м', 'n': 'ո', 'o': 'ο', 'p': 'р',
  'q': 'ԛ', 'r': 'г', 's': 'ѕ', 't': 'т',
  'u': 'ս', 'v': 'ѵ', 'w': 'ԝ', 'x': 'х',
  'y': 'у', 'z': 'ʐ',
  'A': 'А', 'B': 'В', 'C': 'С', 'D': 'ԃ',
  'E': 'Е', 'F': 'ҕ', 'G': 'Ǧ', 'H': 'Н',
  'I': 'І', 'J': 'Ј', 'K': 'К', 'L': 'ⅻ',
  'M': 'М', 'N': 'Η', 'O': 'О', 'P': 'Р',
  'Q': 'Ԛ', 'R': 'Я', 'S': 'Ѕ', 'T': 'Т',
  'U': 'Մ', 'V': 'Ѵ', 'W': 'Ԝ', 'X': 'Х',
  'Y': 'Ү', 'Z': 'Ζ',
  '0': '̅', '1': 'ѷ', '2': 'Ѹ', '3': 'ѹ',
  '4': 'Ѻ', '5': 'Ҁ', '6': 'ҁ', '7': '҂',
  '8': 'ѻ', '9': 'Ѽ',
};

const REVERSE_LOOKALIKE: Record<string, string> = {};
for (const [char, lookalike] of Object.entries(LOOKALIKE_MAP)) {
  REVERSE_LOOKALIKE[lookalike] = char;
}

const EMOTICON_FRAMES = [
  'ヾ(´・ω・｀)ﾉ',
  '(＠◕﹒◕＠)ﾉ',
  '(⊙‿⊙)',
  '╥(･ᴗ･｀✿)╥',
  '♠‿♠ﾉ',
  '(´・ω・`)',
  '༼ つ ◕‿◕ ༽つ',
];

function aaEncode(text: string): string {
  const chars: string[] = [];
  for (const ch of text) {
    if (LOOKALIKE_MAP[ch]) {
      chars.push(LOOKALIKE_MAP[ch]);
    } else if (LOOKALIKE_MAP[ch.toLowerCase()]) {
      chars.push(LOOKALIKE_MAP[ch.toLowerCase()]);
    } else {
      chars.push(ch);
    }
  }
  const frame = EMOTICON_FRAMES[Math.floor(Math.random() * EMOTICON_FRAMES.length)];
  return frame.split('').join('') + ' ' + chars.join('');
}

function aaDecode(text: string): string {
  let str = text.trim();
  // Try to remove surrounding emoticon frame characters (non-ASCII decorative chars)
  // First, split out anything that looks like the actual content
  // Strip common emoticon characters
  str = str.replace(/[༼つヾﾉ♠╥＠⊙✿◕﹒‿―･ᴗ｀´ω・◠◥┘┐┌└　ˇˆ˜˙˚˛˝˞ͣͤͥͦͧͨͩͪͫͬͭͮͯ͢͡͠ǀǁǂǃ`¨˘ˇˆ˜˙˚˛˝˞´^¯ˉ˅]+/g, '');
  // Decode the lookalike characters back
  let result = '';
  for (const ch of str) {
    if (REVERSE_LOOKALIKE[ch]) {
      result += REVERSE_LOOKALIKE[ch];
    } else if (ch.trim()) {
      result += ch;
    }
  }
  return result;
}

function encode() {
  output.value = aaEncode(input.value);
}

function decode() {
  error.value = '';
  try {
    decodeOutput.value = aaDecode(decodeInput.value);
  } catch {
    error.value = '解码失败: 无法解码该颜文字编码';
    decodeOutput.value = '';
  }
}
</script>
