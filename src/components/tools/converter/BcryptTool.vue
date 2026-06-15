<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入密码" placeholder="请输入要哈希的密码" :rows="3" show-count />
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">Salt Rounds (成本因子)</label>
        <select v-model="rounds" class="rounded-md border px-3 py-1.5 text-sm w-full">
          <option :value="4">4 (最低)</option>
          <option :value="5">5</option>
          <option :value="6">6</option>
          <option :value="7">7</option>
          <option :value="8">8</option>
          <option :value="10">10 (推荐)</option>
          <option :value="12">12</option>
          <option :value="14">14</option>
          <option :value="16">16</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">Salt (盐值，可选)</label>
        <input v-model="salt" type="text" placeholder="留空则自动生成" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none " />
      </div>
    </div>
    <div class="flex justify-end">
      <button @click="hashPassword" class="btn-primary">
        生成 Bcrypt 哈希
      </button>
    </div>
    <ErrorAlert :message="error" />
    <TextOutput v-model="hashOutput" label="Bcrypt 哈希值" :rows="3" />
    <div v-if="hashOutput" class="text-xs rounded-md p-3" style="background: var(--glass-light); color: var(--color-text-secondary);">
      <p class="font-medium mb-1">哈希详情</p>
      <p>Rounds: 2<sup>{{ rounds }}</sup> = {{ Math.pow(2, rounds) }} 次迭代</p>
      <p v-if="usedSalt">Salt (Base64): {{ usedSalt }}</p>
      <p class="mt-1 text-xs" style="color: var(--color-text-muted);">
        注意: 本工具使用 PBKDF2-SHA256 + Blowfish 参数模拟 Bcrypt 行为，输出格式类似 Bcrypt。
        如需标准 Bcrypt 兼容输出，请使用 bcryptjs 等专用库。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CryptoJS from 'crypto-js';
import forge from 'node-forge';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const input = ref('');
const rounds = ref(10);
const salt = ref('');
const hashOutput = ref('');
const usedSalt = ref('');
const error = ref('');

// Base64 alphabet for bcrypt (different from standard Base64)
const BCRYPT_ALPHABET = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function toBcryptBase64(hexStr: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < hexStr.length; i += 2) {
    bytes.push(parseInt(hexStr.substring(i, i + 2), 16));
  }
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    let val = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
    result += BCRYPT_ALPHABET.charAt((val >> 18) & 0x3f);
    result += BCRYPT_ALPHABET.charAt((val >> 12) & 0x3f);
    result += BCRYPT_ALPHABET.charAt((val >> 6) & 0x3f);
    result += BCRYPT_ALPHABET.charAt(val & 0x3f);
  }
  return result;
}

function hashPassword() {
  error.value = '';
  hashOutput.value = '';
  usedSalt.value = '';
  try {
    if (!input.value) { error.value = '请输入密码'; return; }

    // Generate 128-bit salt
    let saltHex: string;
    if (salt.value) {
      saltHex = CryptoJS.MD5(salt.value).toString();
    } else {
      saltHex = CryptoJS.lib.WordArray.random(16).toString();
    }
    // Truncate to 16 hex chars = 8 bytes
    saltHex = saltHex.substring(0, 16);
    usedSalt.value = toBcryptBase64(saltHex);

    // Bcrypt-like key derivation:
    // 1. Initialize with EksBlowfish setup (simulated with PBKDF2)
    // 2. Run 2^rounds iterations

    const totalIterations = Math.pow(2, rounds.value);

    // Use PBKDF2 as the base for the bcrypt-like derivation
    const saltBytes = CryptoJS.enc.Hex.parse(saltHex);

    // Simulate EksBlowfish key schedule with multiple PBKDF2 passes
    // The actual bcrypt uses the Blowfish key schedule directly,
    // but we emulate the work factor using PBKDF2-SHA256
    const derived = CryptoJS.PBKDF2(input.value, saltBytes, {
      keySize: 192 / 32, // 192 bits = 24 bytes for bcrypt-style output
      iterations: totalIterations,
      hasher: CryptoJS.algo.SHA256,
    });

    const derivedHex = derived.toString();

    // Format: $2b$[rounds]$[salt][hash]
    const hashPart = toBcryptBase64(derivedHex).substring(0, 31);
    hashOutput.value = `$2b$${String(rounds.value).padStart(2, '0')}$${usedSalt.value}${hashPart}`;
  } catch (e: any) {
    error.value = '哈希计算失败: ' + e.message;
  }
}
</script>
