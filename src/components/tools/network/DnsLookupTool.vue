<template>
  <div class="space-y-4">
    <div class="flex gap-2">
      <input
        v-model="domainInput"
        type="text"
        placeholder="请输入域名，例如: example.com"
        class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        @keyup.enter="lookup"
      />
      <select
        v-model="recordType"
        class="rounded-md border px-3 py-2 text-sm focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      >
        <option v-for="t in recordTypes" :key="t" :value="t">{{ t }}</option>
      </select>
      <button
        @click="lookup"
        :disabled="loading"
        class="px-5 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
        style="background-color: var(--color-primary);"
      >
        {{ loading ? '查询中...' : '查询' }}
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
              <td class="px-4 py-2">
                <span class="px-1.5 py-0.5 rounded text-xs font-medium" :style="{ color: '#fff', backgroundColor: typeColor(record.type) }">{{ typeName(record.type) }}</span>
              </td>
              <td class="px-4 py-2" style="color: var(--color-text);">
                <div class="flex items-center gap-1.5">
                  <span class="font-mono text-xs break-all">{{ formatValue(record) }}</span>
                  <CopyButton :text="formatValue(record)" />
                </div>
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

const recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'SRV', 'CAA'];
const domainInput = ref('');
const recordType = ref('A');
const loading = ref(false);
const error = ref('');
const results = ref<DnsRecord[]>([]);
const noResults = ref(false);

const typeMap: Record<number, string> = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  6: 'SOA',
  12: 'PTR',
  15: 'MX',
  16: 'TXT',
  28: 'AAAA',
  33: 'SRV',
  257: 'CAA',
  46: 'RRSIG',
  48: 'DNSKEY',
};

const typeToNumber: Record<string, number> = {
  A: 1, NS: 2, CNAME: 5, SOA: 6, PTR: 12, MX: 15, TXT: 16, AAAA: 28, SRV: 33, CAA: 257,
};

function typeName(typeNum: number): string {
  return typeMap[typeNum] || `TYPE${typeNum}`;
}

function typeColor(typeNum: number): string {
  switch (typeNum) {
    case 1: return '#2563eb';    // A - blue
    case 5: return '#d97706';    // CNAME - amber
    case 28: return '#7c3aed';   // AAAA - purple
    case 15: return '#059669';   // MX - green
    case 16: return '#0891b2';   // TXT - cyan
    case 2: return '#dc2626';    // NS - red
    case 6: return '#9333ea';    // SOA - violet
    case 33: return '#ea580c';   // SRV - orange
    case 257: return '#be185d';  // CAA - pink
    default: return '#6b7280';   // unknown - gray
  }
}

function formatValue(record: DnsRecord): string {
  if (record.type === 15 && record.priority !== undefined) {
    return `${record.data} (优先级: ${record.priority})`;
  }
  // CNAME 记录末尾的点去掉，更易读
  if (record.type === 5 || record.type === 2 || record.type === 12) {
    return record.data.replace(/\.$/, '');
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

    // NXDOMAIN 或其他错误
    if (data.Status === 3) {
      noResults.value = true;
      return;
    }
    if (data.Status !== 0) {
      throw new Error(`DNS 查询失败 (RCODE: ${data.Status})`);
    }

    // 合并 Answer 和 Authority 中的记录
    const allRecords: DnsRecord[] = [];

    if (data.Answer && data.Answer.length > 0) {
      allRecords.push(...data.Answer);
    }
    if (data.Authority && data.Authority.length > 0) {
      allRecords.push(...data.Authority);
    }

    // CNAME 特殊处理：当查 CNAME 时，Answer 中可能包含 A/AAAA 等后续解析记录
    // 过滤只显示用户查询的类型 + CNAME 链记录
    if (recordType.value === 'CNAME' && allRecords.length > 0) {
      const requestedType = typeToNumber[recordType.value];
      const cnameRecords = allRecords.filter(r => r.type === 5);
      const sameTypeRecords = allRecords.filter(r => r.type === requestedType);

      if (cnameRecords.length > 0) {
        // 优先展示 CNAME 记录，附带后续解析结果
        results.value = [...cnameRecords, ...allRecords.filter(r => r.type !== 5)];
      } else if (sameTypeRecords.length > 0) {
        results.value = sameTypeRecords;
      } else {
        // Answer 中没有 CNAME，但有其他记录（说明域名直接是 A 记录而非 CNAME）
        results.value = allRecords;
      }
    } else if (recordType.value !== 'CNAME' && allRecords.length > 0) {
      // 非 CNAME 查询时，如果结果中有 CNAME 链也一并展示
      const requestedType = typeToNumber[recordType.value];
      const cnameRecords = allRecords.filter(r => r.type === 5);
      const targetRecords = allRecords.filter(r => r.type === requestedType);

      if (cnameRecords.length > 0 && targetRecords.length > 0) {
        // 同时有 CNAME 和目标记录，全部展示
        results.value = allRecords;
      } else {
        results.value = allRecords;
      }
    } else if (allRecords.length > 0) {
      results.value = allRecords;
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
