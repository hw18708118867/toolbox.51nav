<template>
  <div class="space-y-4">
    <div class="flex gap-2">
      <input
        v-model="cidrInput"
        type="text"
        placeholder="例如: 192.168.1.0/24"
        class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none "
        
        @keyup.enter="calculate"
      />
      <button
        @click="calculate"
        class="btn-primary"
      >
        计算
      </button>
    </div>

    <div v-if="error" class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm" style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <div v-if="result" class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
      <table class="w-full text-sm">
        <tbody>
          <tr v-for="(item, index) in resultRows" :key="index" :style="index < resultRows.length - 1 ? 'border-bottom: 1px solid var(--color-border);' : ''">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary); width: 160px;">{{ item.label }}</td>
            <td class="px-4 py-2.5" style="color: var(--color-text);">
              {{ item.value }}
              <CopyButton :text="item.value" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const cidrInput = ref('');
const error = ref('');
const result = ref<{ network: string; broadcast: string; firstIp: string; lastIp: string; hosts: number; mask: string; wildcard: string; range: string } | null>(null);

const resultRows = computed(() => {
  if (!result.value) return [];
  const r = result.value;
  return [
    { label: '网络地址', value: r.network },
    { label: '广播地址', value: r.broadcast },
    { label: '第一个可用 IP', value: r.firstIp },
    { label: '最后一个可用 IP', value: r.lastIp },
    { label: '可用主机数', value: String(r.hosts) },
    { label: '子网掩码', value: r.mask },
    { label: '通配符掩码', value: r.wildcard },
    { label: 'IP 范围', value: r.range },
  ];
});

function ipToNum(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function numToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join('.');
}

function calculate() {
  error.value = '';
  result.value = null;

  const input = cidrInput.value.trim();
  const match = input.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
  if (!match) {
    error.value = '请输入正确的 CIDR 格式，例如: 192.168.1.0/24';
    return;
  }

  const ip = match[1];
  const cidr = parseInt(match[2], 10);

  const ipParts = ip.split('.').map(Number);
  if (ipParts.some(p => p < 0 || p > 255) || cidr < 0 || cidr > 32) {
    error.value = 'IP 地址或子网掩码无效';
    return;
  }

  const ipNum = ipToNum(ip);
  const maskNum = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | ~maskNum) >>> 0;
  const wildcardNum = (~maskNum) >>> 0;

  const hosts = cidr <= 1 ? 0 : (broadcastNum - networkNum - 1);
  const firstIpNum = cidr <= 1 ? networkNum : networkNum + 1;
  const lastIpNum = cidr <= 1 ? broadcastNum : broadcastNum - 1;

  result.value = {
    network: numToIp(networkNum),
    broadcast: numToIp(broadcastNum),
    firstIp: numToIp(firstIpNum),
    lastIp: numToIp(lastIpNum),
    hosts,
    mask: numToIp(maskNum),
    wildcard: numToIp(wildcardNum),
    range: `${numToIp(firstIpNum)} - ${numToIp(lastIpNum)}`,
  };
}
</script>
