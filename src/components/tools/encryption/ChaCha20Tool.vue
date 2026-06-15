<template>
  <div class="space-y-4">
    <TabView :tabs="['加密', '解密']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="encryptInput" label="输入明文" placeholder="请输入要加密的文本" :rows="4" show-count />
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">密钥 (Key, 256-bit)</label>
              <input v-model="key" type="text" placeholder="32 字节密钥（UTF-8）" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none " />
            </div>
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">Nonce (96-bit)</label>
              <input v-model="nonce" type="text" placeholder="12 字节 Nonce（UTF-8）" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none " />
            </div>
          </div>
          <div class="flex items-center gap-4">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">Counter 起始值</label>
            <input v-model.number="counter" type="number" min="0" max="4294967295" class="rounded-md border px-3 py-1.5 text-sm w-24" />
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">输出</label>
            <select v-model="outputFormat" class="rounded-md border px-3 py-1.5 text-sm">
              <option value="Base64">Base64</option>
              <option value="Hex">Hex</option>
            </select>
          </div>
          <div class="flex justify-end">
            <button @click="encrypt" class="btn-primary">加密</button>
          </div>
          <ErrorAlert :message="error" />
          <TextOutput v-model="encryptOutput" label="加密结果" :rows="4" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decryptInput" label="输入密文" placeholder="请输入要解密的密文" :rows="4" show-count />
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">密钥 (Key, 256-bit)</label>
              <input v-model="decryptKey" type="text" placeholder="32 字节密钥（UTF-8）" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none " />
            </div>
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">Nonce (96-bit)</label>
              <input v-model="decryptNonce" type="text" placeholder="12 字节 Nonce（UTF-8）" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none " />
            </div>
          </div>
          <div class="flex items-center gap-4">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">Counter 起始值</label>
            <input v-model.number="decryptCounter" type="number" min="0" max="4294967295" class="rounded-md border px-3 py-1.5 text-sm w-24" />
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">输入格式</label>
            <select v-model="inputFormat" class="rounded-md border px-3 py-1.5 text-sm">
              <option value="Base64">Base64</option>
              <option value="Hex">Hex</option>
            </select>
          </div>
          <div class="flex justify-end">
            <button @click="decrypt" class="btn-primary">解密</button>
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

// ── ChaCha20 Implementation (RFC 8439) ──

function rotl32(v: number, n: number): number {
  return ((v << n) | (v >>> (32 - n))) >>> 0;
}

function quarterRound(state: Uint32Array, a: number, b: number, c: number, d: number): void {
  state[a] = (state[a] + state[b]) >>> 0; state[d] ^= state[a]; state[d] = rotl32(state[d], 16);
  state[c] = (state[c] + state[d]) >>> 0; state[b] ^= state[c]; state[b] = rotl32(state[b], 12);
  state[a] = (state[a] + state[b]) >>> 0; state[d] ^= state[a]; state[d] = rotl32(state[d], 8);
  state[c] = (state[c] + state[d]) >>> 0; state[b] ^= state[c]; state[b] = rotl32(state[b], 7);
}

function chacha20Block(key: Uint32Array, counter: number, nonce: Uint32Array): Uint8Array {
  // Constants: "expand 32-byte k"
  const state = new Uint32Array(16);
  state[0] = 0x61707865; state[1] = 0x3320646e; state[2] = 0x79622d32; state[3] = 0x6b206574;
  state[4] = key[0]; state[5] = key[1]; state[6] = key[2]; state[7] = key[3];
  state[8] = key[4]; state[9] = key[5]; state[10] = key[6]; state[11] = key[7];
  state[12] = counter;
  state[13] = nonce[0]; state[14] = nonce[1]; state[15] = nonce[2];

  const working = new Uint32Array(state);

  // 20 rounds (10 double rounds)
  for (let i = 0; i < 10; i++) {
    // Column rounds
    quarterRound(working, 0, 4, 8, 12);
    quarterRound(working, 1, 5, 9, 13);
    quarterRound(working, 2, 6, 10, 14);
    quarterRound(working, 3, 7, 11, 15);
    // Diagonal rounds
    quarterRound(working, 0, 5, 10, 15);
    quarterRound(working, 1, 6, 11, 12);
    quarterRound(working, 2, 7, 8, 13);
    quarterRound(working, 3, 4, 9, 14);
  }

  // Add original state
  for (let i = 0; i < 16; i++) {
    working[i] = (working[i] + state[i]) >>> 0;
  }

  const out = new Uint8Array(64);
  const view = new DataView(out.buffer);
  for (let i = 0; i < 16; i++) {
    view.setUint32(i * 4, working[i], true);
  }
  return out;
}

function bytesToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const u8 = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return u8;
}

function uint8ArrayToWords(u8: Uint8Array): CryptoJS.lib.WordArray {
  const words: number[] = [];
  for (let i = 0; i < u8.length; i += 4) {
    words.push(
      ((u8[i] << 24) | (u8[i + 1] << 16) | (u8[i + 2] << 8) | (u8[i + 3])) >>> 0
    );
  }
  return CryptoJS.lib.WordArray.create(words, u8.length);
}

function prepareKey(keyStr: string): Uint32Array {
  const keyBytes = CryptoJS.enc.Utf8.parse(keyStr);
  const padded = new Uint8Array(32);
  const src = bytesToUint8Array(keyBytes);
  for (let i = 0; i < Math.min(src.length, 32); i++) {
    padded[i] = src[i];
  }
  const result = new Uint32Array(8);
  const view = new DataView(padded.buffer);
  for (let i = 0; i < 8; i++) {
    result[i] = view.getUint32(i * 4, true);
  }
  return result;
}

function prepareNonce(nonceStr: string): Uint32Array {
  const nonceBytes = CryptoJS.enc.Utf8.parse(nonceStr);
  const padded = new Uint8Array(12);
  const src = bytesToUint8Array(nonceBytes);
  for (let i = 0; i < Math.min(src.length, 12); i++) {
    padded[i] = src[i];
  }
  const result = new Uint32Array(3);
  const view = new DataView(padded.buffer);
  for (let i = 0; i < 3; i++) {
    result[i] = view.getUint32(i * 4, true);
  }
  return result;
}

function chacha20Encrypt(plaintext: Uint8Array, key: Uint32Array, counter: number, nonce: Uint32Array): Uint8Array {
  const ciphertext = new Uint8Array(plaintext.length);
  let blockCounter = counter;

  for (let i = 0; i < plaintext.length; i += 64) {
    const keystream = chacha20Block(key, blockCounter, nonce);
    blockCounter++;
    for (let j = 0; j < 64 && i + j < plaintext.length; j++) {
      ciphertext[i + j] = plaintext[i + j] ^ keystream[j];
    }
  }

  return ciphertext;
}

// ── Encrypt State ──
const encryptInput = ref('');
const key = ref('');
const nonce = ref('');
const counter = ref(0);
const outputFormat = ref('Base64');
const encryptOutput = ref('');
const error = ref('');

// ── Decrypt State ──
const decryptInput = ref('');
const decryptKey = ref('');
const decryptNonce = ref('');
const decryptCounter = ref(0);
const inputFormat = ref('Base64');
const decryptOutput = ref('');
const decryptError = ref('');

function encrypt() {
  error.value = '';
  encryptOutput.value = '';
  try {
    if (!encryptInput.value) { error.value = '请输入明文'; return; }
    const keyArr = prepareKey(key.value || 'ChaCha20-Default-Key-32bytes!!');
    const nonceArr = prepareNonce(nonce.value || 'ChaCha20-Nonce12');
    const plaintext = bytesToUint8Array(CryptoJS.enc.Utf8.parse(encryptInput.value));
    const ciphertext = chacha20Encrypt(plaintext, keyArr, counter.value, nonceArr);

    encryptOutput.value = outputFormat.value === 'Base64'
      ? CryptoJS.enc.Base64.stringify(uint8ArrayToWords(ciphertext))
      : CryptoJS.enc.Hex.stringify(uint8ArrayToWords(ciphertext));
  } catch (e: any) {
    error.value = '加密失败: ' + e.message;
  }
}

function decrypt() {
  decryptError.value = '';
  decryptOutput.value = '';
  try {
    if (!decryptInput.value) { decryptError.value = '请输入密文'; return; }
    const keyArr = prepareKey(decryptKey.value || 'ChaCha20-Default-Key-32bytes!!');
    const nonceArr = prepareNonce(decryptNonce.value || 'ChaCha20-Nonce12');

    let ciphertext: Uint8Array;
    try {
      const words = inputFormat.value === 'Base64'
        ? CryptoJS.enc.Base64.parse(decryptInput.value)
        : CryptoJS.enc.Hex.parse(decryptInput.value);
      ciphertext = bytesToUint8Array(words);
    } catch {
      decryptError.value = '解密失败: 密文格式不正确';
      return;
    }

    // ChaCha20 decrypt = encrypt (XOR with same keystream)
    const plaintext = chacha20Encrypt(ciphertext, keyArr, decryptCounter.value, nonceArr);
    decryptOutput.value = CryptoJS.enc.Utf8.stringify(uint8ArrayToWords(plaintext));

    if (!decryptOutput.value && ciphertext.length > 0) {
      decryptError.value = '解密失败: 密钥或参数不正确';
    }
  } catch (e: any) {
    decryptError.value = '解密失败: ' + e.message;
  }
}
</script>
