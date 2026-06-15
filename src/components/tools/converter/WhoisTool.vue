<template>
  <div class="space-y-4">
    <TextInput v-model="domainInput" label="域名" placeholder="例如: example.com 或 1.1.1.1" :rows="1" />

    <div class="flex justify-end">
      <button
        @click="whoisLookup"
        :disabled="!domainInput.trim() || loading"
        class="btn-primary"
      >
        {{ loading ? '查询中...' : '查询' }}
      </button>
    </div>

    <ErrorAlert :message="error" />

    <div v-if="loading" class="flex items-center justify-center py-8">
      <svg class="animate-spin h-6 w-6" style="color: var(--color-primary);" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span class="ml-2 text-sm" style="color: var(--color-text-muted);">查询中...</span>
    </div>

    <div v-if="result && !loading" class="space-y-3">
      <div class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
        <table class="w-full text-sm">
          <tbody>
            <tr v-if="result.domain" style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary); width: 140px;">域名</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">
                {{ result.domain }}
                <CopyButton :text="result.domain" />
              </td>
            </tr>
            <tr v-if="result.registry" style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">注册商</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">{{ result.registry }}</td>
            </tr>
            <tr v-if="result.creationDate" style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">创建日期</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">{{ result.creationDate }}</td>
            </tr>
            <tr v-if="result.expiryDate" style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">过期日期</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">{{ result.expiryDate }}</td>
            </tr>
            <tr v-if="result.nameServers && result.nameServers.length" style="border-bottom: 1px solid var(--color-border);">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">DNS 服务器</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">
                <div v-for="ns in result.nameServers" :key="ns" class="text-sm">{{ ns }}</div>
              </td>
            </tr>
            <tr v-if="result.status && result.status.length">
              <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">状态</td>
              <td class="px-4 py-2.5" style="color: var(--color-text);">
                <span
                  v-for="s in result.status"
                  :key="s"
                  class="inline-block text-xs px-2 py-0.5 rounded mr-1 mb-1"
                  :style="{
                    backgroundColor: s.toLowerCase().includes('active') || s.toLowerCase().includes('ok') ? '#dcfce7' : '#fef9c3',
                    color: s.toLowerCase().includes('active') || s.toLowerCase().includes('ok') ? '#166534' : '#854d0e',
                  }"
                >{{ s }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <details class="rounded-md border" style="border-color: var(--color-border);">
        <summary class="px-4 py-2.5 text-xs font-medium cursor-pointer" style="color: var(--color-text-secondary); background-color: var(--color-bg-secondary);">
          查看原始 RDAP 响应
        </summary>
        <div class="p-4 max-h-[400px] overflow-auto" style="background-color: var(--color-bg-tertiary);">
          <pre class="text-xs font-mono whitespace-pre-wrap break-all" style="color: var(--color-text);">{{ JSON.stringify(result.raw, null, 2) }}</pre>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';
import CopyButton from '../../common/CopyButton.vue';

const domainInput = ref('');
const loading = ref(false);
const error = ref('');

interface WhoisResult {
  domain: string;
  registry: string;
  creationDate: string;
  expiryDate: string;
  nameServers: string[];
  status: string[];
  raw: any;
}

const result = ref<WhoisResult | null>(null);

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN');
  } catch {
    return dateStr;
  }
}

async function whoisLookup() {
  const input = domainInput.value.trim();
  if (!input) {
    error.value = '请输入域名或 IP 地址';
    return;
  }

  loading.value = true;
  error.value = '';
  result.value = null;

  try {
    // Clean input — extract domain from URL if needed
    let domain = input;
    if (domain.includes('://')) {
      try {
        domain = new URL(domain).hostname;
      } catch {
        // keep as-is
      }
    }
    // Remove path
    if (domain.includes('/')) {
      domain = domain.split('/')[0];
    }

    // Try RDAP API first (works for domain names and IPs)
    const rdapUrl = `https://rdap.org/domain/${encodeURIComponent(domain)}`;
    const rdapRes = await fetch(rdapUrl, { signal: AbortSignal.timeout(15000) });

    if (rdapRes.ok) {
      const data = await rdapRes.json();
      result.value = {
        domain: data.ldhName || domain,
        registry: data.port43 || extractVcardItem(data.entities?.[0]?.vcardArray, 'fn') || '未知',
        creationDate: extractEventDate(data.events, 'registration') || '-',
        expiryDate: extractEventDate(data.events, 'expiration') || '-',
        nameServers: (data.nameservers || []).map((ns: any) => ns.ldhName || ns.objectClassName || JSON.stringify(ns)),
        status: data.status || [],
        raw: data,
      };
    } else if (rdapRes.status === 404) {
      // Try IP lookup
      const ipRes = await fetch(`https://rdap.org/ip/${encodeURIComponent(domain)}`, { signal: AbortSignal.timeout(15000) });
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        result.value = {
          domain: domain,
          registry: ipData.port43 || extractVcardItem(ipData.entities?.[0]?.vcardArray, 'fn') || '未知',
          creationDate: extractEventDate(ipData.events, 'registration') || '-',
          expiryDate: '-',
          nameServers: [],
          status: ipData.status || [],
          raw: ipData,
        };
      } else {
        // Try whois via third-party API
        const whoisRes = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, { signal: AbortSignal.timeout(15000) });
        if (whoisRes.ok) {
          const whoisData = await whoisRes.json();
          result.value = {
            domain: whoisData.ldhName || domain,
            registry: whoisData.port43 || extractVcardItem(whoisData.entities?.[0]?.vcardArray, 'fn') || '未知',
            creationDate: extractEventDate(whoisData.events, 'registration') || '-',
            expiryDate: extractEventDate(whoisData.events, 'expiration') || '-',
            nameServers: (whoisData.nameservers || []).map((ns: any) => ns.ldhName || ns.objectClassName || JSON.stringify(ns)),
            status: whoisData.status || [],
            raw: whoisData,
          };
        } else {
          error.value = `查询失败: RDAP 服务返回错误 (HTTP ${rdapRes.status})。该域名可能不在 RDAP 支持的 TLD 范围内。`;
        }
      }
    } else {
      error.value = `查询失败: RDAP 服务返回错误 (HTTP ${rdapRes.status})`;
    }
  } catch (e: any) {
    if (e.name === 'AbortError' || e.name === 'TimeoutError') {
      error.value = '查询超时，请稍后重试';
    } else {
      error.value = '查询失败: ' + (e.message || '网络错误');
    }
  } finally {
    loading.value = false;
  }
}

function extractEventDate(events: any[], action: string): string {
  if (!events || !Array.isArray(events)) return '';
  const event = events.find((e: any) => e.eventAction === action);
  if (event?.eventDate) {
    return formatDate(event.eventDate);
  }
  return '';
}

function extractVcardItem(vcardArray: any, prop: string): string {
  if (!vcardArray || !Array.isArray(vcardArray)) return '';
  const inner = vcardArray.length === 2 && Array.isArray(vcardArray[1]) ? vcardArray[1] : vcardArray;
  for (const item of inner) {
    if (Array.isArray(item) && item[0] === prop && item[3]) {
      return item[3];
    }
  }
  return '';
}
</script>
