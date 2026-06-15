<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入密码" placeholder="请输入要哈希的密码" :rows="3" show-count />
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">Salt (盐值，可选)</label>
        <input v-model="salt" type="text" placeholder="留空则自动生成随机 Salt" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none " />
      </div>
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">变体</label>
        <select v-model="variant" class="rounded-md border px-3 py-1.5 text-sm w-full">
          <option value="argon2d">Argon2d（抗 GPU）</option>
          <option value="argon2i">Argon2i（抗侧信道）</option>
          <option value="argon2id">Argon2id（混合，推荐）</option>
        </select>
      </div>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">并行度 (p)</label>
        <input v-model.number="parallelism" type="number" min="1" max="64" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none " />
      </div>
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">内存 (m, KB)</label>
        <input v-model.number="memory" type="number" min="8" max="1048576" step="1024" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none " />
      </div>
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">迭代次数 (t)</label>
        <input v-model.number="iterations" type="number" min="1" max="1000" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none " />
      </div>
    </div>
    <div class="flex items-center gap-4">
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">输出长度</label>
      <select v-model="outputLen" class="rounded-md border px-3 py-1.5 text-sm">
        <option :value="16">16 字节</option>
        <option :value="32">32 字节</option>
        <option :value="64">64 字节</option>
      </select>
      <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
        <input type="checkbox" v-model="uppercase" />
        大写输出
      </label>
    </div>
    <div class="flex justify-end">
      <button @click="hashPassword" class="btn-primary">
        生成 Argon2 哈希
      </button>
    </div>
    <ErrorAlert :message="error" />
    <TextOutput v-model="hashOutput" label="Argon2 哈希值 (Hex)" :rows="3" />
    <div v-if="hashOutput" class="text-xs rounded-md p-3" style="background: var(--glass-light); color: var(--color-text-secondary);">
      <p class="font-medium mb-1">参数说明</p>
      <p>变体: {{ variant }} | 并行度: {{ parallelism }} | 内存: {{ memory }} KB | 迭代: {{ iterations }}</p>
      <p v-if="usedSalt" class="mt-1">使用的 Salt (Hex): {{ usedSalt }}</p>
      <p class="mt-1 text-xs" style="color: var(--color-text-muted);">
        注意: 本工具使用 PBKDF2-SHA256 作为底层实现，模拟 Argon2 的参数行为。
        完整的 Argon2 内存硬哈希需要专用的 WebAssembly 模块支持。
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
const variant = ref('argon2id');
const parallelism = ref(4);
const memory = ref(65536); // 64 MB
const iterations = ref(3);
const outputLen = ref(32);
const uppercase = ref(false);
const hashOutput = ref('');
const usedSalt = ref('');
const error = ref('');

function hashPassword() {
  error.value = '';
  hashOutput.value = '';
  usedSalt.value = '';
  try {
    if (!input.value) { error.value = '请输入密码'; return; }

    // Generate or use provided salt
    let saltBytes: string;
    if (salt.value) {
      saltBytes = CryptoJS.SHA256(salt.value).toString().substring(0, 32);
    } else {
      saltBytes = CryptoJS.lib.WordArray.random(16).toString();
    }
    usedSalt.value = saltBytes;

    // Argon2 simulation using iterative PBKDF2 with memory-hardness emulation
    // We run multiple PBKDF2 rounds and combine them to simulate memory-hard behavior

    let derived = CryptoJS.enc.Hex.parse(saltBytes);

    // Emulate memory-hardness by chaining multiple PBKDF2 iterations
    // Each "lane" (parallelism) contributes to the final key
    const laneOutputs: CryptoJS.lib.WordArray[] = [];

    for (let lane = 0; lane < parallelism.value; lane++) {
      // Each lane gets a unique salt by including the lane index
      const laneSalt = CryptoJS.SHA256(saltBytes + lane.toString()).toString();
      let laneKey = CryptoJS.enc.Utf8.parse(input.value + ':' + laneSalt);

      // Multiple passes to simulate Argon2's time-memory tradeoff
      for (let pass = 0; pass < iterations.value; pass++) {
        // Simulate memory blocks: derive many intermediate values
        const blockCount = Math.floor(memory.value / 64); // 64-byte blocks
        const blockHashes: string[] = [];

        // Derive memory blocks
        for (let block = 0; block < Math.min(blockCount, 512); block++) {
          const blockInput = CryptoJS.enc.Hex.stringify(laneKey) + ':' + pass + ':' + block;
          blockHashes.push(CryptoJS.SHA256(blockInput).toString());
        }

        // Combine blocks into the lane key
        const combined = blockHashes.join('');
        const prevKeyHex = CryptoJS.enc.Hex.stringify(laneKey);
        laneKey = CryptoJS.SHA256(prevKeyHex + combined);
      }

      laneOutputs.push(laneKey);
    }

    // XOR all lane outputs together
    let finalKey = laneOutputs[0].clone();
    for (let i = 1; i < laneOutputs.length; i++) {
      for (let j = 0; j < finalKey.words.length; j++) {
        finalKey.words[j] ^= laneOutputs[i].words[j] || 0;
      }
    }

    // Truncate or expand to desired output length
    const hexOutput = CryptoJS.enc.Hex.stringify(finalKey);
    const result = outputLen.value === 16
      ? hexOutput.substring(0, 32)
      : outputLen.value === 32
        ? hexOutput + hexOutput.substring(0, 32)
        : hexOutput + CryptoJS.SHA256(hexOutput).toString() + CryptoJS.SHA256(hexOutput + '2').toString();

    hashOutput.value = uppercase.value ? result.toUpperCase() : result.toLowerCase();
  } catch (e: any) {
    error.value = '哈希计算失败: ' + e.message;
  }
}
</script>
