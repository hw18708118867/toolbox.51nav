<template>
  <div class="space-y-5">
    <!-- 助记词 -->
    <div class="rounded-md border p-4" style="border-color: var(--color-border);">
      <div class="flex items-center justify-between mb-2">
        <label class="text-xs font-medium" style="color: var(--color-text-secondary);">BIP39 助记词（空格分隔，可编辑）</label>
        <div class="flex items-center gap-2">
          <select v-model.number="wordCount" class="rounded-md border px-2 py-1 text-xs" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);">
            <option :value="12">12 词</option>
            <option :value="15">15 词</option>
            <option :value="18">18 词</option>
            <option :value="21">21 词</option>
            <option :value="24">24 词</option>
          </select>
          <button class="text-xs font-medium px-3 py-1.5 rounded-md text-white" style="background-color: var(--color-primary);" @click="generate">随机生成</button>
        </div>
      </div>
      <textarea
        v-model="mnemonic"
        rows="3"
        placeholder="在此粘贴或输入助记词，例如 abandon abandon ... about"
        class="w-full rounded-md border px-3 py-2 text-sm font-mono resize-y focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      ></textarea>
      <div class="flex items-center justify-between mt-2">
        <span class="text-xs" style="color: var(--color-text-muted);">共 {{ wordList.length }} 个词（{{ wordList.length ? '已输入 ' + wordList.length + ' 词' : '' }}）</span>
        <CopyButton :text="mnemonic.trim()" />
      </div>
    </div>

    <!-- 校验结果 -->
    <div class="rounded-md border p-4" style="border-color: var(--color-border);">
      <div class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">实时校验</div>
      <div
        class="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium mb-3"
        :style="validation.ok ? 'background-color: #f0fdf4; color: #16a34a;' : (mnemonic.trim() ? 'background-color: #fef2f2; color: #dc2626;' : 'background-color: var(--color-bg-secondary); color: var(--color-text-muted);')"
      >
        <span>{{ validation.ok ? '✓ 助记词有效' : (mnemonic.trim() ? '✗ ' + validation.message : '输入助记词后自动校验') }}</span>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="(w, i) in wordList"
          :key="i"
          class="text-[11px] px-2 py-1 rounded font-mono"
          :style="validation.wordValid[i] ? 'background-color: var(--color-bg-secondary); color: var(--color-text);' : 'background-color: #fee2e2; color: #dc2626;'"
        >{{ i + 1 }}.{{ w }}</span>
        <span v-if="!wordList.length" class="text-xs" style="color: var(--color-text-muted);">—</span>
      </div>
    </div>

    <!-- 派生种子 -->
    <div class="rounded-md border p-4" style="border-color: var(--color-border);">
      <div class="flex items-center justify-between mb-2">
        <label class="text-xs font-medium" style="color: var(--color-text-secondary);">派生 BIP39 种子（Seed）</label>
        <button class="text-xs font-medium px-3 py-1.5 rounded-md text-white" style="background-color: var(--color-primary);" @click="derive">派生种子</button>
      </div>
      <div class="flex items-center gap-2 mb-3">
        <input
          v-model="passphrase"
          type="text"
          placeholder="可选密码（BIP39 passphrase / 25th word）"
          class="flex-1 rounded-md border px-3 py-1.5 text-sm focus:outline-none"
          style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        />
      </div>
      <div v-if="seedHex" class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs" style="color: var(--color-text-secondary);">64 字节种子（十六进制）</span>
          <CopyButton :text="seedHex" />
        </div>
        <div class="rounded-md border px-3 py-2 break-all font-mono text-xs" style="border-color: var(--color-border); background-color: var(--color-bg-secondary); color: var(--color-text);">{{ seedHex }}</div>
        <p v-if="!validation.ok" class="text-xs" style="color: #dc2626;">注意：当前助记词校验和未通过，派生的种子可能与标准钱包不一致，请确认助记词正确。</p>
      </div>
      <p v-else class="text-xs" style="color: var(--color-text-muted);">点击「派生种子」基于助记词与密码通过 PBKDF2-HMAC-SHA512（2048 次）计算 512 位种子。</p>
    </div>

    <p class="text-xs leading-relaxed" style="color: var(--color-text-muted);">
      所有计算均在浏览器本地完成，助记词与种子不会离开你的设备。请妥善保管生成的助记词，任何拿到它的人都能控制对应资产。
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';
import { BIP39_ENGLISH } from '../../../data/bip39-english';
import { sha256 } from '@noble/hashes/sha256';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha512 } from '@noble/hashes/sha512';
import { bytesToHex } from '@noble/hashes/utils';

const wordCount = ref(12);
const mnemonic = ref('');
const passphrase = ref('');
const seedHex = ref('');

const wordList = computed(() => mnemonic.value.trim().split(/\s+/).filter(Boolean));

function bytesToBits(bytes: Uint8Array | number[]): number[] {
  const o: number[] = [];
  for (const b of bytes) for (let i = 7; i >= 0; i--) o.push((b >> i) & 1);
  return o;
}
function bitsToInt(bits: number[]): number {
  return bits.reduce((a, b) => (a << 1) | b, 0);
}
function normWord(w: string): string {
  return w.toLowerCase().normalize('NFKD');
}

function entropyToMnemonic(ent: Uint8Array): string {
  const csLen = (ent.length * 8) / 32;
  const cs = bytesToBits(sha256(ent)).slice(0, csLen);
  const bits = bytesToBits(ent).concat(cs);
  const words: string[] = [];
  for (let i = 0; i < bits.length; i += 11) {
    words.push(BIP39_ENGLISH[bitsToInt(bits.slice(i, i + 11))]);
  }
  return words.join(' ');
}

function generate() {
  const entBytes = (wordCount.value / 3) * 4;
  const ent = crypto.getRandomValues(new Uint8Array(entBytes));
  mnemonic.value = entropyToMnemonic(ent);
  seedHex.value = '';
}

interface Validation {
  wordValid: boolean[];
  ok: boolean;
  message: string;
}
const validation = computed<Validation>(() => {
  const raw = wordList.value;
  const wordValid = raw.map((w) => BIP39_ENGLISH.includes(normWord(w)));
  const allValid = wordValid.every(Boolean);
  if (!raw.length) return { wordValid, ok: false, message: '' };
  if (!allValid) return { wordValid, ok: false, message: '包含不在 BIP39 词表中的单词（标红）' };
  if (![12, 15, 18, 21, 24].includes(raw.length)) {
    return { wordValid, ok: false, message: '词数必须为 12 / 15 / 18 / 21 / 24' };
  }
  const indices = raw.map((w) => BIP39_ENGLISH.indexOf(normWord(w)));
  const bits: number[] = [];
  for (const idx of indices) for (let i = 10; i >= 0; i--) bits.push((idx >> i) & 1);
  const entBitLen = (raw.length * 32) / 33;
  const csLen = raw.length / 33;
  const entropy: number[] = [];
  for (let i = 0; i < entBitLen; i += 8) entropy.push(bitsToInt(bits.slice(i, i + 8)));
  const expectedCs = bytesToBits(sha256(new Uint8Array(entropy))).slice(0, csLen);
  const csBits = bits.slice(entBitLen);
  const checksumValid = expectedCs.every((b, i) => b === csBits[i]);
  return {
    wordValid,
    ok: checksumValid,
    message: checksumValid ? '校验和正确' : '校验和错误：助记词可能被修改或不完整',
  };
});

function derive() {
  const m = mnemonic.value.trim().normalize('NFKD');
  const pw = new TextEncoder().encode(m);
  const salt = new TextEncoder().encode(('mnemonic' + passphrase.value).normalize('NFKD'));
  const seed = pbkdf2(sha512, pw, salt, { c: 2048, dkLen: 64 });
  seedHex.value = bytesToHex(seed);
}
</script>
