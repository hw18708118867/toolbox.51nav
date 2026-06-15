<template>
  <div class="space-y-4">
    <TextInput v-model="cidrInput" label="CIDR 地址" placeholder="例如: 192.168.1.0/24" :rows="1" />

    <div class="flex justify-end">
      <button
        @click="calculate"
        :disabled="!cidrInput.trim()"
        class="btn-primary"
      >
        计算
      </button>
    </div>

    <ErrorAlert :message="error" />

    <div v-if="result" class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <div class="text-xs mb-1" style="color: var(--color-text-secondary);">网络地址</div>
          <div class="text-sm font-mono" style="color: var(--color-text);">{{ result.network }}</div>
        </div>
        <div class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <div class="text-xs mb-1" style="color: var(--color-text-secondary);">广播地址</div>
          <div class="text-sm font-mono" style="color: var(--color-text);">{{ result.broadcast }}</div>
        </div>
        <div class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <div class="text-xs mb-1" style="color: var(--color-text-secondary);">第一个可用 IP</div>
          <div class="text-sm font-mono" style="color: var(--color-text);">{{ result.first }}</div>
        </div>
        <div class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <div class="text-xs mb-1" style="color: var(--color-text-secondary);">最后一个可用 IP</div>
          <div class="text-sm font-mono" style="color: var(--color-text);">{{ result.last }}</div>
        </div>
        <div class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <div class="text-xs mb-1" style="color: var(--color-text-secondary);">子网掩码</div>
          <div class="text-sm font-mono" style="color: var(--color-text);">{{ result.mask }}</div>
        </div>
        <div class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
          <div class="text-xs mb-1" style="color: var(--color-text-secondary);">总地址数</div>
          <div class="text-sm font-mono" style="color: var(--color-text);">{{ result.total }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const cidrInput = ref('');
const error = ref('');

interface CidrResult {
  network: string;
  broadcast: string;
  first: string;
  last: string;
  mask: string;
  total: number;
}

const result = ref<CidrResult | null>(null);

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function longToIp(long: number): string {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255,
  ].join('.');
}

function calculate() {
  error.value = '';
  result.value = null;

  const parts = cidrInput.value.trim().split('/');
  if (parts.length !== 2) {
    error.value = '请输入有效的 CIDR 地址 (例如: 192.168.1.0/24)';
    return;
  }

  const ip = parts[0];
  const prefix = parseInt(parts[1], 10);

  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    error.value = 'IP 地址格式无效';
    return;
  }

  const octets = ip.split('.').map(Number);
  if (octets.some(o => o > 255 || o < 0)) {
    error.value = 'IP 地址超出范围';
    return;
  }

  if (isNaN(prefix) || prefix < 0 || prefix > 32) {
    error.value = '前缀长度必须在 0-32 之间';
    return;
  }

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const ipLong = ipToLong(ip);
  const network = (ipLong & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const total = prefix >= 31 ? Math.pow(2, 32 - prefix) : Math.pow(2, 32 - prefix);
  const first = prefix >= 31 ? network : network + 1;
  const last = prefix >= 31 ? broadcast : broadcast - 1;

  result.value = {
    network: longToIp(network),
    broadcast: longToIp(broadcast),
    first: longToIp(first),
    last: longToIp(last),
    mask: longToIp(mask),
    total,
  };
}
</script>
