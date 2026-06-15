<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入 IP 地址" placeholder="请输入 IPv4 地址（如 192.168.1.1）" :rows="2" show-count />
    <div class="flex justify-end">
      <button @click="convert" class="btn-primary">转换</button>
    </div>
    <ErrorAlert :message="error" />
    <div v-if="results.length > 0" class="rounded-md border p-4 space-y-2" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <div v-for="r in results" :key="r.label" class="flex items-center justify-between text-sm">
        <span style="color: var(--color-text-secondary);">{{ r.label }}</span>
        <div class="flex items-center gap-2"><code style="color: var(--color-primary);">{{ r.value }}</code><CopyButton :text="r.value" /></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';
const input = ref('');
const results = ref<{label:string;value:string}[]>([]);
const error = ref('');
function convert() {
  error.value = ''; results.value = [];
  const ip = input.value.trim();
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) { error.value = '请输入有效的 IPv4 地址'; return; }
  const parts = ip.split('.').map(Number);
  if (parts.some(p => p > 255)) { error.value = 'IP 地址每段不能超过 255'; return; }
  const int = ((parts[0] * 256 + parts[1]) * 256 + parts[2]) * 256 + parts[3];
  const hex = parts.map(p => p.toString(16).padStart(2, '0')).join(':');
  const hexUpper = parts.map(p => '0x' + p.toString(16).padStart(2, '0')).join(' ');
  const bin = parts.map(p => p.toString(2).padStart(8, '0')).join('.');
  results.value = [
    { label: '十进制整数', value: String(int >>> 0) },
    { label: '十六进制', value: '0x' + (int >>> 0).toString(16).toUpperCase() },
    { label: '十六进制 (冒号)', value: hex.toUpperCase() },
    { label: '十六进制 (0x)', value: hexUpper.toUpperCase() },
    { label: '二进制', value: bin },
  ];
}
</script>
