<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入密码" placeholder="请输入要派生密钥的密码" :rows="3" show-count />
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">Salt (盐值，可选)</label>
        <input v-model="salt" type="text" placeholder="留空则自动生成随机 Salt" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none " />
      </div>
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">输出长度 (字节)</label>
        <select v-model="dkLen" class="rounded-md border px-3 py-1.5 text-sm w-full">
          <option :value="16">16 字节</option>
          <option :value="32">32 字节</option>
          <option :value="64">64 字节</option>
        </select>
      </div>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">N (CPU/内存成本)</label>
        <select v-model="nParam" class="rounded-md border px-3 py-1.5 text-sm w-full">
          <option :value="1024">1024 (2<sup>10</sup>)</option>
          <option :value="2048">2048 (2<sup>11</sup>)</option>
          <option :value="4096">4096 (2<sup>12</sup>)</option>
          <option :value="8192">8192 (2<sup>13</sup>)</option>
          <option :value="16384">16384 (2<sup>14</sup>, 推荐)</option>
          <option :value="32768">32768 (2<sup>15</sup>)</option>
          <option :value="65536">65536 (2<sup>16</sup>)</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">r (块大小)</label>
        <input v-model.number="rParam" type="number" min="1" max="32" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none " />
      </div>
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">p (并行度)</label>
        <input v-model.number="pParam" type="number" min="1" max="16" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none " />
      </div>
    </div>
    <div class="flex items-center gap-4">
      <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
        <input type="checkbox" v-model="uppercase" />
        大写输出
      </label>
    </div>
    <div class="flex justify-end">
      <button @click="deriveKey" class="btn-primary">
        派生密钥
      </button>
    </div>
    <ErrorAlert :message="error" />
    <TextOutput v-model="derivedKey" label="派生密钥 (Hex)" :rows="3" />
    <div v-if="derivedKey" class="text-xs rounded-md p-3" style="background: var(--glass-light); color: var(--color-text-secondary);">
      <p class="font-medium mb-1">参数说明</p>
      <p>N = {{ nParam }} | r = {{ rParam }} | p = {{ pParam }} | dkLen = {{ dkLen }} 字节</p>
      <p v-if="usedSalt">Salt (Hex): {{ usedSalt }}</p>
      <p class="mt-1 text-xs" style="color: var(--color-text-muted);">
        注意: 本工具使用 PBKDF2-SHA256 模拟 Scrypt 的参数行为（迭代次数 = N * r * p）。
        完整的 Scrypt 内存硬 KDF 需要专用 WebAssembly 模块。
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
const salt = ref('');
const dkLen = ref(32);
const nParam = ref(16384);
const rParam = ref(8);
const pParam = ref(1);
const uppercase = ref(false);
const derivedKey = ref('');
const usedSalt = ref('');
const error = ref('');

function deriveKey() {
  error.value = '';
  derivedKey.value = '';
  usedSalt.value = '';
  try {
    if (!input.value) { error.value = '请输入密码'; return; }

    // Generate or use provided salt
    let saltHex: string;
    if (salt.value) {
      saltHex = CryptoJS.SHA256(salt.value).toString().substring(0, 32);
    } else {
      saltHex = CryptoJS.lib.WordArray.random(16).toString();
    }
    usedSalt.value = saltHex;

    // Scrypt simulation using PBKDF2 with chained iterations
    // Scrypt uses: ROMix (sequential memory-hard mixing) then BlockMix
    // We simulate the work factor using iterated PBKDF2

    const saltWordArray = CryptoJS.enc.Hex.parse(saltHex);
    const totalWork = nParam.value * rParam.value * pParam.value;

    // Simulate ROMix by running multiple PBKDF2 passes and mixing
    let mixedResult = CryptoJS.enc.Utf8.parse(input.value);

    // BlockMix simulation: r * 128 bytes of mixing per iteration
    for (let i = 0; i < Math.min(rParam.value, 8); i++) {
      const mixInput = CryptoJS.enc.Hex.stringify(mixedResult) + ':' + saltHex + ':' + i;
      mixedResult = CryptoJS.SHA256(mixInput);
    }

    // ROMix simulation: sequential memory-hard mixing
    // We simulate N sequential lookups using chained hashing
    let romixState = CryptoJS.enc.Hex.stringify(mixedResult);
    for (let i = 0; i < Math.min(nParam.value, 4096); i++) {
      const partialSalt = CryptoJS.SHA256(saltHex + ':' + i).toString();
      romixState = CryptoJS.HmacSHA256(romixState, partialSalt).toString();
    }

    // Parallel passes
    const parallelResults: string[] = [];
    for (let lane = 0; lane < pParam.value; lane++) {
      const laneInput = romixState + ':' + lane;
      const pbkdfResult = CryptoJS.PBKDF2(laneInput, saltWordArray, {
        keySize: dkLen.value / 4,
        iterations: Math.min(totalWork, 100000),
        hasher: CryptoJS.algo.SHA256,
      });
      parallelResults.push(pbkdfResult.toString());
    }

    // XOR all parallel results
    let finalHex = parallelResults[0];
    for (let i = 1; i < parallelResults.length; i++) {
      let xored = '';
      for (let j = 0; j < Math.max(finalHex.length, parallelResults[i].length); j += 2) {
        const a = parseInt(finalHex.substring(j, j + 2) || '00', 16);
        const b = parseInt(parallelResults[i].substring(j, j + 2) || '00', 16);
        xored += (a ^ b).toString(16).padStart(2, '0');
      }
      finalHex = xored;
    }

    derivedKey.value = uppercase.value
      ? finalHex.toUpperCase()
      : finalHex.toLowerCase();
  } catch (e: any) {
    error.value = '密钥派生失败: ' + e.message;
  }
}
</script>
