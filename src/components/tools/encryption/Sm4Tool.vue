<template>
  <div class="space-y-4">
    <TabView :tabs="['加密', '解密']">
      <!-- Tab 0: 加密 -->
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="encryptInput" label="输入明文" placeholder="请输入要加密的文本" :rows="4" show-count />
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">密钥 (128-bit Key)</label>
              <input v-model="key" type="text" placeholder="16 字节密钥（UTF-8）" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "  />
            </div>
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">IV（CBC 模式需要）</label>
              <input v-model="iv" type="text" placeholder="16 字节 IV（UTF-8）" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "  />
            </div>
          </div>
          <div class="flex items-center gap-4">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">模式</label>
            <select v-model="mode" class="rounded-md border px-3 py-1.5 text-sm" >
              <option value="ECB">ECB</option>
              <option value="CBC">CBC</option>
            </select>
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">输出</label>
            <select v-model="outputFormat" class="rounded-md border px-3 py-1.5 text-sm" >
              <option value="Base64">Base64</option>
              <option value="Hex">Hex</option>
            </select>
          </div>
          <div class="flex justify-end">
            <button @click="encrypt" class="btn-primary">
              加密
            </button>
          </div>
          <ErrorAlert :message="error" />
          <TextOutput v-model="encryptOutput" label="加密结果" :rows="4" />
        </div>
      </template>

      <!-- Tab 1: 解密 -->
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decryptInput" label="输入密文" placeholder="请输入要解密的密文" :rows="4" show-count />
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">密钥 (128-bit Key)</label>
              <input v-model="decryptKey" type="text" placeholder="16 字节密钥（UTF-8）" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "  />
            </div>
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">IV（CBC 模式需要）</label>
              <input v-model="decryptIv" type="text" placeholder="16 字节 IV（UTF-8）" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "  />
            </div>
          </div>
          <div class="flex items-center gap-4">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">模式</label>
            <select v-model="decryptMode" class="rounded-md border px-3 py-1.5 text-sm" >
              <option value="ECB">ECB</option>
              <option value="CBC">CBC</option>
            </select>
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">输入格式</label>
            <select v-model="inputFormat" class="rounded-md border px-3 py-1.5 text-sm" >
              <option value="Base64">Base64</option>
              <option value="Hex">Hex</option>
            </select>
          </div>
          <div class="flex justify-end">
            <button @click="decrypt" class="btn-primary">
              解密
            </button>
          </div>
          <ErrorAlert :message="decryptError" />
          <TextOutput v-model="decryptOutput" label="解密结果" :rows="4" />
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CryptoJS from 'crypto-js';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import TabView from '../../common/TabView.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

// ── SM4 Cipher Implementation ──
// SM4 is a 128-bit block cipher with 128-bit key (Chinese National Standard GM/T 0002-2012)

const SBOX: number[] = [
  0xd6, 0x90, 0xe9, 0xfe, 0xcc, 0xe1, 0x3d, 0xb7, 0x16, 0xb6, 0x14, 0xc2, 0x28, 0xfb, 0x2c, 0x05,
  0x2b, 0x67, 0x9a, 0x76, 0x2a, 0xbe, 0x04, 0xc3, 0xaa, 0x44, 0x13, 0x26, 0x49, 0x86, 0x06, 0x99,
  0x9c, 0x42, 0x50, 0xf4, 0x91, 0xef, 0x98, 0x7a, 0x33, 0x54, 0x0b, 0x43, 0xed, 0xcf, 0xac, 0x62,
  0xe4, 0xb3, 0x1c, 0xa9, 0xc9, 0x08, 0xe8, 0x95, 0x80, 0xdf, 0x94, 0xfa, 0x75, 0x8f, 0x3f, 0xa6,
  0x47, 0x07, 0xa7, 0xfc, 0xf3, 0x73, 0x17, 0xba, 0x83, 0x59, 0x3c, 0x19, 0xe6, 0x85, 0x4f, 0xa8,
  0x68, 0x6b, 0x81, 0xb2, 0x71, 0x64, 0xda, 0x8b, 0xf8, 0xeb, 0x0f, 0x4b, 0x70, 0x56, 0x9d, 0x35,
  0x1e, 0x24, 0x0e, 0x5e, 0x63, 0x58, 0xd1, 0xa2, 0x25, 0x22, 0x7c, 0x3b, 0x01, 0x21, 0x78, 0x87,
  0xd4, 0x00, 0x46, 0x57, 0x9f, 0xd3, 0x27, 0x52, 0x4c, 0x36, 0x02, 0xe7, 0xa0, 0xc4, 0xc8, 0x9e,
  0xea, 0xbf, 0x8a, 0xd2, 0x40, 0xc7, 0x38, 0xb5, 0xa3, 0xf7, 0xf2, 0xce, 0xf9, 0x61, 0x15, 0xa1,
  0xe0, 0xae, 0x5d, 0xa4, 0x9b, 0x34, 0x1a, 0x55, 0xad, 0x93, 0x32, 0x30, 0xf5, 0x8c, 0xb1, 0xe3,
  0x1d, 0xf6, 0xe2, 0x2e, 0x82, 0x66, 0xca, 0x60, 0xc0, 0x29, 0x23, 0xab, 0x0d, 0x53, 0x4e, 0x6f,
  0xd5, 0xdb, 0x37, 0x45, 0xde, 0xfd, 0x8e, 0x2f, 0x03, 0xff, 0x6a, 0x72, 0x6d, 0x6c, 0x5b, 0x51,
  0x8d, 0x1b, 0xaf, 0x92, 0xbb, 0xdd, 0xbc, 0x7f, 0x11, 0xd9, 0x5c, 0x41, 0x1f, 0x10, 0x5a, 0xd8,
  0x0a, 0xc1, 0x31, 0x88, 0xa5, 0xcd, 0x7b, 0xbd, 0x2d, 0x74, 0xd0, 0x12, 0xb8, 0xe5, 0xb4, 0xb0,
  0x89, 0x69, 0x97, 0x4a, 0x0c, 0x96, 0x77, 0x7e, 0x65, 0xb9, 0xf1, 0x09, 0xc5, 0x6e, 0xc6, 0x84,
  0x18, 0xf0, 0x7d, 0xec, 0x3a, 0xdc, 0x4d, 0x20, 0x79, 0xee, 0x5f, 0x3e, 0xd7, 0xcb, 0x39, 0x48,
];

const FK = [0xa3b1bac6, 0x56aa3350, 0x677d9197, 0xb27022dc];

// Compute CK constants: CK[i][j] = (4*i + j) * 7 mod 256
const CK: number[] = [];
for (let i = 0; i < 32; i++) {
  let ck = 0;
  for (let j = 0; j < 4; j++) {
    ck = (ck << 8) | ((4 * i + j) * 7) & 0xff;
  }
  CK.push(ck >>> 0);
}

function tau(a: number): number {
  return (
    (SBOX[(a >>> 24) & 0xff] << 24) |
    (SBOX[(a >>> 16) & 0xff] << 16) |
    (SBOX[(a >>> 8) & 0xff] << 8) |
    (SBOX[a & 0xff])
  ) >>> 0;
}

function rotl(x: number, n: number): number {
  return ((x << n) | (x >>> (32 - n))) >>> 0;
}

function l1(b: number): number {
  return (b ^ rotl(b, 2) ^ rotl(b, 10) ^ rotl(b, 18) ^ rotl(b, 24)) >>> 0;
}

function l2(b: number): number {
  return (b ^ rotl(b, 13) ^ rotl(b, 23)) >>> 0;
}

function t(x: number): number {
  return l1(tau(x));
}

function t2(x: number): number {
  return l2(tau(x));
}

function sm4KeySchedule(mk: number[]): number[] {
  const rk: number[] = new Array(32);
  const k: number[] = new Array(36);
  for (let i = 0; i < 4; i++) {
    k[i] = (mk[i] ^ FK[i]) >>> 0;
  }
  for (let i = 0; i < 32; i++) {
    k[i + 4] = (k[i] ^ t2(k[i + 1] ^ k[i + 2] ^ k[i + 3] ^ CK[i])) >>> 0;
    rk[i] = k[i + 4];
  }
  return rk;
}

function sm4EncryptBlock(input: number[], rk: number[]): number[] {
  const x: number[] = new Array(36);
  for (let i = 0; i < 4; i++) {
    x[i] = input[i];
  }
  for (let i = 0; i < 32; i++) {
    x[i + 4] = (x[i] ^ t(x[i + 1] ^ x[i + 2] ^ x[i + 3] ^ rk[i])) >>> 0;
  }
  return [x[35], x[34], x[33], x[32]];
}

function sm4DecryptBlock(input: number[], rk: number[]): number[] {
  const x: number[] = new Array(36);
  for (let i = 0; i < 4; i++) {
    x[i] = input[i];
  }
  for (let i = 0; i < 32; i++) {
    x[i + 4] = (x[i] ^ t(x[i + 1] ^ x[i + 2] ^ x[i + 3] ^ rk[31 - i])) >>> 0;
  }
  return [x[35], x[34], x[33], x[32]];
}

function wordsToBlock(words: CryptoJS.lib.WordArray, offset: number): number[] {
  return [
    words.words[offset] >>> 0,
    words.words[offset + 1] >>> 0,
    words.words[offset + 2] >>> 0,
    words.words[offset + 3] >>> 0,
  ];
}

function blockToWords(block: number[], words: CryptoJS.lib.WordArray, offset: number): void {
  words.words[offset] = block[0] >>> 0;
  words.words[offset + 1] = block[1] >>> 0;
  words.words[offset + 2] = block[2] >>> 0;
  words.words[offset + 3] = block[3] >>> 0;
}

function padData(data: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray {
  const blockSize = 16;
  const padding = blockSize - (data.sigBytes % blockSize);
  const padWordArray = CryptoJS.lib.WordArray.create([], data.sigBytes + padding);
  padWordArray.words.set(data.words);
  padWordArray.words[data.sigBytes >> 2] |= padding << (24 - 8 * (data.sigBytes % 4));
  for (let i = (data.sigBytes >> 2) + 1; i < padWordArray.words.length; i++) {
    padWordArray.words[i] = 0;
  }
  return padWordArray;
}

function unpadData(data: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray {
  const bytes = data.words;
  const lastByte = (bytes[(data.sigBytes - 1) >> 2] >>> (24 - 8 * ((data.sigBytes - 1) % 4))) & 0xff;
  if (lastByte > 0 && lastByte <= 16) {
    data.sigBytes -= lastByte;
  }
  return data;
}

function sm4Process(data: CryptoJS.lib.WordArray, rk: number[], mode: string, ivWordArray: CryptoJS.lib.WordArray | null, isEncrypt: boolean): CryptoJS.lib.WordArray {
  const result = CryptoJS.lib.WordArray.create([], data.sigBytes);
  const blockCount = data.sigBytes / 16;
  const fn = isEncrypt ? sm4EncryptBlock : sm4DecryptBlock;

  let prevBlock: number[] | null = null;
  if (mode === 'CBC' && ivWordArray && ivWordArray.sigBytes >= 16) {
    prevBlock = wordsToBlock(ivWordArray, 0);
  }

  for (let i = 0; i < blockCount; i++) {
    let block = wordsToBlock(data, i * 4);
    if (mode === 'CBC') {
      if (isEncrypt && prevBlock) {
        block = [block[0] ^ prevBlock[0], block[1] ^ prevBlock[1], block[2] ^ prevBlock[2], block[3] ^ prevBlock[3]];
      }
    }
    const processed = fn(block, rk);
    if (mode === 'CBC' && !isEncrypt && prevBlock) {
      processed[0] ^= prevBlock[0];
      processed[1] ^= prevBlock[1];
      processed[2] ^= prevBlock[2];
      processed[3] ^= prevBlock[3];
    }
    if (mode === 'CBC') {
      prevBlock = isEncrypt ? processed : block;
    }
    blockToWords(processed, result, i * 4);
  }
  result.sigBytes = data.sigBytes;
  return result;
}

// ── Encrypt State ──
const encryptInput = ref('');
const key = ref('');
const iv = ref('');
const mode = ref('ECB');
const outputFormat = ref('Base64');
const encryptOutput = ref('');
const error = ref('');

// ── Decrypt State ──
const decryptInput = ref('');
const decryptKey = ref('');
const decryptIv = ref('');
const decryptMode = ref('ECB');
const inputFormat = ref('Base64');
const decryptOutput = ref('');
const decryptError = ref('');

function keyToWords(keyStr: string): number[] {
  const keyBytes = CryptoJS.enc.Utf8.parse(keyStr);
  // Ensure 16 bytes: pad or truncate
  const k = CryptoJS.lib.WordArray.create(16);
  for (let i = 0; i < Math.min(keyBytes.sigBytes, 16); i++) {
    k.words[i >> 2] |= ((keyBytes.words[i >> 2] >>> (24 - 8 * (i % 4))) & 0xff) << (24 - 8 * (i % 4));
  }
  k.sigBytes = 16;
  return [k.words[0] >>> 0, k.words[1] >>> 0, k.words[2] >>> 0, k.words[3] >>> 0];
}

function ivToWords(ivStr: string): CryptoJS.lib.WordArray {
  const ivBytes = CryptoJS.enc.Utf8.parse(ivStr);
  const ivWord = CryptoJS.lib.WordArray.create(16);
  for (let i = 0; i < Math.min(ivBytes.sigBytes, 16); i++) {
    ivWord.words[i >> 2] |= ((ivBytes.words[i >> 2] >>> (24 - 8 * (i % 4))) & 0xff) << (24 - 8 * (i % 4));
  }
  ivWord.words[3] = ivWord.words[3] || 0;
  ivWord.sigBytes = 16;
  return ivWord;
}

function encrypt() {
  error.value = '';
  encryptOutput.value = '';
  try {
    if (!encryptInput.value) { error.value = '请输入明文'; return; }
    const mk = keyToWords(key.value || 'SM4_DEFAULT_KEY!');
    const rk = sm4KeySchedule(mk);
    const plainData = CryptoJS.enc.Utf8.parse(encryptInput.value);
    const paddedData = padData(plainData);
    const ivWord = mode.value === 'CBC' ? ivToWords(iv.value || 'SM4_DEFAULT_IV!!') : null;

    const result = sm4Process(paddedData, rk, mode.value, ivWord, true);

    encryptOutput.value = outputFormat.value === 'Base64'
      ? CryptoJS.enc.Base64.stringify(result)
      : result.toString();
  } catch (e: any) {
    error.value = '加密失败: ' + e.message;
  }
}

function decrypt() {
  decryptError.value = '';
  decryptOutput.value = '';
  try {
    if (!decryptInput.value) { decryptError.value = '请输入密文'; return; }
    const mk = keyToWords(decryptKey.value || 'SM4_DEFAULT_KEY!');
    const rk = sm4KeySchedule(mk);
    const ivWord = decryptMode.value === 'CBC' ? ivToWords(decryptIv.value || 'SM4_DEFAULT_IV!!') : null;

    let cipherData: CryptoJS.lib.WordArray;
    try {
      cipherData = inputFormat.value === 'Base64'
        ? CryptoJS.enc.Base64.parse(decryptInput.value)
        : CryptoJS.enc.Hex.parse(decryptInput.value);
    } catch {
      decryptError.value = '解密失败: 密文格式不正确';
      return;
    }

    const result = sm4Process(cipherData, rk, decryptMode.value, ivWord, false);
    const unpadded = unpadData(result);
    decryptOutput.value = CryptoJS.enc.Utf8.stringify(unpadded);

    if (!decryptOutput.value) {
      decryptError.value = '解密失败: 密钥不正确或密文已损坏';
    }
  } catch (e: any) {
    decryptError.value = '解密失败: ' + e.message;
  }
}
</script>
