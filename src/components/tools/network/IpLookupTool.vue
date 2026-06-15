<template>
  <div class="space-y-4">
    <div class="flex gap-2">
      <input
        v-model="ipInput"
        type="text"
        placeholder="请输入 IP 地址"
        class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none "
        
        @keyup.enter="lookup"
      />
      <button
        @click="lookup"
        :disabled="loading"
        class="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        查询
      </button>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-8">
      <svg class="animate-spin h-6 w-6" style="color: var(--color-primary);" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span class="ml-2 text-sm" style="color: var(--color-text-muted);">查询中...</span>
    </div>

    <div v-if="error" class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm" style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <div v-if="result && !loading" class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
      <table class="w-full text-sm">
        <tbody>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary); width: 140px;">IP 地址</td>
            <td class="px-4 py-2.5" style="color: var(--color-text);">
              {{ result.ip }}
              <CopyButton :text="result.ip" />
            </td>
          </tr>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">位置</td>
            <td class="px-4 py-2.5" style="color: var(--color-text);">
              {{ [result.country_name, result.region, result.city].filter(Boolean).join(' - ') }}
              <CopyButton :text="[result.country_name, result.region, result.city].filter(Boolean).join(' - ')" />
            </td>
          </tr>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">ISP</td>
            <td class="px-4 py-2.5" style="color: var(--color-text);">
              {{ result.org || '未知' }}
              <CopyButton v-if="result.org" :text="result.org" />
            </td>
          </tr>
          <tr>
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">时区</td>
            <td class="px-4 py-2.5" style="color: var(--color-text);">
              {{ result.timezone || '未知' }}
              <CopyButton v-if="result.timezone" :text="result.timezone" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

interface IpResult {
  ip: string;
  country_name?: string;
  region?: string;
  city?: string;
  org?: string;
  timezone?: string;
}

const ipInput = ref('');
const loading = ref(false);
const error = ref('');
const result = ref<IpResult | null>(null);

async function detectMyIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    ipInput.value = data.ip;
    await lookup();
  } catch {
    // Silently fail auto-detect
  }
}

async function lookup() {
  const ip = ipInput.value.trim();
  if (!ip) {
    error.value = '请输入 IP 地址';
    return;
  }

  loading.value = true;
  error.value = '';
  result.value = null;

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!res.ok) {
      throw new Error(`查询失败 (HTTP ${res.status})`);
    }
    const data = await res.json();
    if (data.error) {
      throw new Error(data.reason || '查询失败');
    }
    result.value = data as IpResult;
  } catch (e: any) {
    error.value = e.message || '查询失败，请检查 IP 地址是否正确';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  detectMyIp();
});
</script>
