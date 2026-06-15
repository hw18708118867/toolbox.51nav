<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要计算 SM3 哈希的文本" :rows="5" show-count />
    <div class="flex items-center gap-4">
      <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
        <input type="checkbox" v-model="uppercase" />
        大写输出
      </label>
    </div>
    <div class="flex justify-end">
      <button @click="calculate" class="btn-primary">
        计算 SM3
      </button>
    </div>
    <TextOutput v-model="output" label="SM3 哈希值" :rows="3" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');
const uppercase = ref(false);

// SM3 纯 JavaScript 实现
function sm3(str: string): string {
  const encoder = new TextEncoder();
  const msg = encoder.encode(str);
  return sm3Digest(msg);
}

function sm3Digest(msg: Uint8Array): string {
  // 填充
  const bitLen = msg.length * 8;
  const padLen = msg.length % 64 < 56 ? 64 - msg.length % 64 - 9 : 128 - msg.length % 64 - 9;
  const padded = new Uint8Array(msg.length + padLen + 8 + 1);
  padded.set(msg);
  padded[msg.length] = 0x80;

  // 追加长度（64位大端）
  const lenView = new DataView(padded.buffer);
  lenView.setUint32(padded.length - 4, bitLen, false);
  lenView.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000), false);

  const n = padded.length / 64;
  let V = new Uint32Array([0x7380166f, 0x4914b2b9, 0x172442d7, 0xda8a0600, 0xa96f30bc, 0x163138aa, 0xe38dee4d, 0xb0fb0e4e]);

  for (let i = 0; i < n; i++) {
    const W = new Uint32Array(68);
    const W1 = new Uint32Array(64);
    for (let j = 0; j < 16; j++) {
      W[j] = lenView.getUint32(i * 64 + j * 4, false);
    }
    for (let j = 16; j < 68; j++) {
      W[j] = p1(W[j - 16] ^ W[j - 9] ^ rotl(W[j - 3], 15)) ^ rotl(W[j - 13], 7) ^ W[j - 6];
    }
    for (let j = 0; j < 64; j++) {
      W1[j] = W[j] ^ W[j + 4];
    }

    let A = V[0], B = V[1], C = V[2], D = V[3];
    let E = V[4], F = V[5], G = V[6], H = V[7];

    for (let j = 0; j < 64; j++) {
      const T = j < 16 ? 0x79cc4519 : 0x7a879d8a;
      const SS1 = rotl((rotl(A, 12) + E + rotl(T, j % 32)) & 0xffffffff, 7);
      const SS2 = SS1 ^ rotl(A, 12);
      const TT1 = (ff(j, A, B, C) + D + SS2 + W1[j]) & 0xffffffff;
      const TT2 = (gg(j, E, F, G) + H + SS1 + W[j]) & 0xffffffff;
      D = C; C = rotl(B, 9); B = A; A = TT1;
      H = G; G = rotl(F, 19); F = E; E = p0(TT2);
    }

    V[0] ^= A; V[1] ^= B; V[2] ^= C; V[3] ^= D;
    V[4] ^= E; V[5] ^= F; V[6] ^= G; V[7] ^= H;
  }

  return Array.from(V).map(v => v.toString(16).padStart(8, '0')).join('');
}

function rotl(x: number, n: number): number {
  n %= 32;
  return ((x << n) | (x >>> (32 - n))) & 0xffffffff;
}

function ff(j: number, x: number, y: number, z: number): number {
  return j < 16 ? (x ^ y ^ z) : ((x & y) | (x & z) | (y & z));
}

function gg(j: number, x: number, y: number, z: number): number {
  return j < 16 ? (x ^ y ^ z) : ((x & y) | ((~x) & z));
}

function p0(x: number): number {
  return x ^ rotl(x, 9) ^ rotl(x, 17);
}

function p1(x: number): number {
  return x ^ rotl(x, 15) ^ rotl(x, 23);
}

function calculate() {
  const hash = sm3(input.value);
  output.value = uppercase.value ? hash.toUpperCase() : hash;
}
</script>
