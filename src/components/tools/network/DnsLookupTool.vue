<template>
  <div class="space-y-4">
    <div class="flex gap-2">
      <input
        v-model="domainInput"
        type="text"
        placeholder="请输入域名，例如: example.com"
        class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none "
        
        @keyup.enter="lookup"
      />
      <select
        v-model="recordType"
        class="rounded-md border px-3 py-2 text-sm focus:outline-none "
        
      >
        <option v-for="t in recordTypes" :key="t" :value="t">{{ t }}</option>
      </select>
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

    <div v-if="results.length > 0 && !loading">
      <div class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
        <table class="w-full text-sm">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-border);">
              <th class="px-4 py-2 text-left font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">Name</th>
              <th class="px-4 py-2 text-left font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">TTL</th>
              <th class="px-4 py-2 text-left font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">Type</th>
              <th class="px-4 py-2 text-left font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in results" :key="index" :style="index < results.length - 1 ? 'border-bottom: 1px solid var(--color-border);' : ''">
              <td class="px-4 py-2" style="color: var(--color-text);">{{ record.name }}</td>
              <td class="px-4 py-2" style="color: var(--color-text);">{{ record.TTL }}</td>
              <td class="px-4 py-2" style="color: var(--color-text);">{{ record.type }}</td>
              <td class="px-4 py-2" style="color: var(--color-text);">
                {{ formatValue(record) }}
                <CopyButton :text="formatValue(record)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="noResults" class="text-center py-6 text-sm" style="color: var(--color-text-muted);">
      未找到 {{ recordType }} 类型的记录
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

interface DnsRecord {
  name: string;
  type: number;
  TTL: number;
  data: string;
  priority?: number;
}

const recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'];
const domainInput = ref('');
const recordType = ref('A');
const loading = ref(false);
const error = ref('');
const results = ref<DnsRecord[]>([]);
const noResults = ref(false);

function formatValue(record: DnsRecord): string {
  if (record.type === 15 && record.priority !== undefined) {
    return `${record.data} (优先级: ${record.priority})`;
  }
  return record.data;
}

async function lookup() {
  const domain = domainInput.value.trim();
  if (!domain) {
    error.value = '请输入域名';
    return;
  }

  loading.value = true;
  error.value = '';
  results.value = [];
  noResults.value = false;

  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${recordType.value}`,
      { headers: { Accept: 'application/dns-json' } }
    );
    if (!res.ok) {
      throw new Error(`查询失败 (HTTP ${res.status})`);
    }
    const data = await res.json();
    if (data.Status !== 0) {
      throw new Error(`DNS 查询失败 (RCODE: ${data.Status})`);
    }
    if (data.Answer && data.Answer.length > 0) {
      results.value = data.Answer;
    } else {
      noResults.value = true;
    }
  } catch (e: any) {
    error.value = e.message || '查询失败，请检查域名是否正确';
  } finally {
    loading.value = false;
  }
}
</script>
