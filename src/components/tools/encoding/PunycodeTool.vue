<template>
  <div class="space-y-4">
    <TabView :tabs="['编码', '解码']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="input" label="输入域名/文本" placeholder="请输入要编码为 Punycode 的域名或文本" :rows="6" show-count />
          <div class="flex justify-end">
            <button @click="encode" class="btn-primary">
              编码
            </button>
          </div>
          <TextOutput v-model="output" label="Punycode 结果" :rows="6" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decodeInput" label="输入 Punycode" placeholder="请输入 Punycode 编码的域名（含 xn-- 前缀）" :rows="6" show-count />
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

const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;

function adaptBias(delta: number, numPoints: number, firstTime: boolean): number {
  let k = 0;
  if (firstTime) {
    delta = Math.floor(delta / DAMP);
  } else {
    delta = Math.floor(delta / 2);
  }
  delta += Math.floor(delta / numPoints);
  while (delta > ((BASE - TMIN) * TMAX) / 2) {
    delta = Math.floor(delta / (BASE - TMIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - TMIN + 1) * delta) / (delta + SKEW));
}

function encodeDigit(d: number): string {
  return d < 26 ? String.fromCharCode(d + 97) : String.fromCharCode(d + 22);
}

function decodeDigit(ch: string): number {
  const code = ch.charCodeAt(0);
  if (code >= 48 && code <= 57) return code - 22;
  if (code >= 65 && code <= 90) return code - 65;
  if (code >= 97 && code <= 122) return code - 97;
  return -1;
}

function punycodeEncode(input: string): string {
  const chars: number[] = [];
  for (let i = 0; i < input.length; i++) {
    chars.push(input.charCodeAt(i));
  }
  let n = INITIAL_N;
  let delta = 0;
  let bias = INITIAL_BIAS;
  const output: number[] = [];
  // Collect basic (ASCII) code points
  for (const ch of chars) {
    if (ch < 128) {
      output.push(ch);
    }
  }
  let b = output.length;
  let h = b;
  if (b > 0) output.push('-'.charCodeAt(0));
  while (h < chars.length) {
    let m = 0x10ffff;
    for (const ch of chars) {
      if (ch >= n && ch < m) m = ch;
    }
    delta += (m - n) * (h + 1);
    n = m;
    for (const ch of chars) {
      if (ch < n) {
        delta++;
      } else if (ch === n) {
        let q = delta;
        for (let k = BASE; ; k += BASE) {
          let t: number;
          if (k <= bias) {
            t = TMIN;
          } else if (k >= bias + TMAX) {
            t = TMAX;
          } else {
            t = k - bias;
          }
          if (q < t) break;
          output.push(encodeDigit(t + ((q - t) % (BASE - t))).charCodeAt(0));
          q = Math.floor((q - t) / (BASE - t));
        }
        output.push(encodeDigit(q).charCodeAt(0));
        bias = adaptBias(delta, h + 1, h === b);
        delta = 0;
        h++;
      }
    }
    delta++;
    n++;
  }
  return String.fromCharCode(...output);
}

function punycodeDecode(input: string): string {
  let str = input;
  const delim = str.lastIndexOf('-');
  let n = INITIAL_N;
  let i = 0;
  let bias = INITIAL_BIAS;
  const output: number[] = [];
  // Process basic code points
  const basicEnd = delim >= 0 ? delim : 0;
  for (let j = 0; j < basicEnd; j++) {
    const ch = str.charCodeAt(j);
    output.push(ch);
  }
  let inputStart = delim >= 0 ? delim + 1 : 0;
  while (inputStart < str.length) {
    const oldI = i;
    let w = 1;
    for (let k = BASE; ; k += BASE) {
      const digit = decodeDigit(str[inputStart++]);
      i += digit * w;
      let t: number;
      if (k <= bias) {
        t = TMIN;
      } else if (k >= bias + TMAX) {
        t = TMAX;
      } else {
        t = k - bias;
      }
      if (digit < t) break;
      w *= BASE - t;
    }
    bias = adaptBias(i - oldI, output.length + 1, oldI === 0);
    n += Math.floor(i / (output.length + 1));
    i = i % (output.length + 1);
    output.splice(i, 0, n);
    i++;
  }
  return String.fromCharCode(...output);
}

function encode() {
  const text = input.value.trim();
  if (!text) {
    output.value = '';
    return;
  }
  if (text.includes('.')) {
    const labels = text.split('.');
    const encoded = labels.map((label) => {
      if (/^[\x00-\x7F]*$/.test(label)) return label;
      return 'xn--' + punycodeEncode(label);
    });
    output.value = encoded.join('.');
  } else {
    if (/^[\x00-\x7F]*$/.test(text)) {
      output.value = text;
    } else {
      output.value = 'xn--' + punycodeEncode(text);
    }
  }
}

function decode() {
  error.value = '';
  try {
    const text = decodeInput.value.trim();
    if (!text) {
      decodeOutput.value = '';
      return;
    }
    if (text.includes('.')) {
      const labels = text.split('.');
      const decoded = labels.map((label) => {
        if (label.toLowerCase().startsWith('xn--')) {
          return punycodeDecode(label.substring(4));
        }
        return label;
      });
      decodeOutput.value = decoded.join('.');
    } else {
      if (text.toLowerCase().startsWith('xn--')) {
        decodeOutput.value = punycodeDecode(text.substring(4));
      } else {
        decodeOutput.value = text;
      }
    }
  } catch {
    error.value = '解码失败: 输入不是有效的 Punycode 字符串';
    decodeOutput.value = '';
  }
}
</script>
