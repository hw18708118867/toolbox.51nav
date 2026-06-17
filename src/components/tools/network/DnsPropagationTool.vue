<template>
  <div class="space-y-4">
    <div class="flex gap-2 flex-wrap">
      <input
        v-model="domainInput"
        type="text"
        placeholder="输入域名，例如: 51nav.com"
        class="flex-1 min-w-[200px] rounded-md border px-3 py-2 text-sm focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        @keyup.enter="checkPropagation"
      />
      <select
        v-model="recordType"
        class="rounded-md border px-3 py-2 text-sm focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      >
        <option value="A">A</option>
        <option value="AAAA">AAAA</option>
        <option value="CNAME">CNAME</option>
        <option value="MX">MX</option>
        <option value="TXT">TXT</option>
        <option value="NS">NS</option>
      </select>
      <button
        @click="checkPropagation"
        :disabled="loading"
        class="px-5 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
        style="background-color: var(--color-primary);"
      >
        {{ loading ? '查询中...' : '全球对比查询' }}
      </button>
    </div>

    <!-- 加载 -->
    <div v-if="loading" class="space-y-2">
      <div class="flex items-center gap-2 text-sm" style="color: var(--color-text-muted);">
        <svg class="animate-spin h-4 w-4" style="color: var(--color-primary);" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        正在向 {{ providers.length }} 个 DNS 服务商查询...
      </div>
    </div>

    <!-- 错误 -->
    <div v-if="error" class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm" style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- 结果 -->
    <div v-if="queryResults.length > 0 && !loading">
      <!-- 一致性摘要 -->
      <div class="flex items-center gap-3 p-3 rounded-md" :style="{ backgroundColor: consensusAllMatch ? '#f0fdf4' : 'var(--color-bg-tertiary)' }">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-lg">
          {{ consensusAllMatch ? '✅' : '⚠️' }}
        </div>
        <div>
          <p class="text-sm font-semibold" :style="{ color: consensusAllMatch ? '#166534' : 'var(--color-text)' }">
            {{ consensusAllMatch ? '全部一致 — DNS 已完全传播' : '存在差异 — DNS 可能尚未完全传播' }}
          </p>
          <p class="text-xs mt-0.5" style="color: var(--color-text-muted);">
            {{ consensusAllMatch ? '所有 DNS 服务商返回结果完全相同' : `${queryResults.filter(r => r.ok).length}/${queryResults.length} 个服务商响应成功，${uniqueIpCount} 种不同结果` }}
          </p>
        </div>
      </div>

      <!-- 对比卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="(result, idx) in queryResults"
          :key="idx"
          class="rounded-md border p-3"
          :style="{
            borderColor: result.ok ? (isMatch(result) ? '#86efac' : '#fcd34d') : '#fecaca',
            backgroundColor: result.ok ? 'var(--color-bg-primary)' : '#fef2f2',
          }"
        >
          <!-- 标题行 -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold" style="color: var(--color-text);">{{ result.providerName }}</span>
              <span v-if="result.ok" class="text-xs px-1.5 py-0.5 rounded" :style="{ backgroundColor: isMatch(result) ? '#dcfce7' : '#fef3c7', color: isMatch(result) ? '#166534' : '#92400e' }">
                {{ isMatch(result) ? '✓ 一致' : '△ 不同' }}
              </span>
              <span v-else class="text-xs px-1.5 py-0.5 rounded" style="background-color: #fee2e2; color: #991b1b;">
                ✗ 失败
              </span>
            </div>
            <span class="text-xs" style="color: var(--color-text-muted);">{{ result.duration }}ms</span>
          </div>

          <!-- IP / 数据 -->
          <div v-if="result.ok">
            <div v-if="result.records.length > 0" class="space-y-1">
              <div
                v-for="(rec, ridx) in result.records"
                :key="ridx"
                class="flex items-center justify-between text-xs rounded px-2 py-1"
                :style="{ backgroundColor: getRecordBgColor(rec, result.records) }"
              >
                <span class="font-mono break-all mr-2" style="color: var(--color-text);">{{ rec.data }}</span>
                <span class="shrink-0" style="color: var(--color-text-muted);">TTL {{ rec.TTL }}</span>
              </div>
            </div>
            <div v-else class="text-xs" style="color: var(--color-text-muted);">
              无 {{ recordType }} 记录
            </div>
          </div>
          <div v-else class="text-xs" style="color: #991b1b;">
            {{ result.errorMsg }}
          </div>
        </div>
      </div>

      <!-- 图例 -->
      <div class="flex flex-wrap items-center gap-4 text-xs" style="color: var(--color-text-muted);">
        <span class="flex items-center gap-1">
          <span class="inline-block w-3 h-3 rounded border" style="background-color: #dcfce7; border-color: #86efac;"></span> 多数返回此值
        </span>
        <span class="flex items-center gap-1">
          <span class="inline-block w-3 h-3 rounded border" style="background-color: #fef3c7; border-color: #fcd34d;"></span> 少数返回此值
        </span>
        <span class="flex items-center gap-1">
          <span class="inline-block w-3 h-3 rounded border" style="background-color: #f3f4f6; border-color: #e5e7eb;"></span> 唯一值
        </span>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && queryResults.length === 0 && !error" class="text-center py-12">
      <div class="text-4xl mb-3">🌐</div>
      <p class="text-sm font-medium mb-1" style="color: var(--color-text);">多 DNS 对比查询</p>
      <p class="text-xs leading-relaxed" style="color: var(--color-text-muted); max-width: 460px; margin: 0 auto;">
        同时向 {{ providers.length }} 个全球 DNS 服务商查询同一域名，<br/>
        对比返回结果，判断 DNS 是否已完全传播。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface DnsRecord {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface ProviderResult {
  providerName: string;
  providerId: string;
  ok: boolean;
  records: DnsRecord[];
  errorMsg: string;
  duration: number;
}

// 全球 DNS-over-HTTPS 服务商
const providers = [
  { id: 'cloudflare', name: '☁️ Cloudflare', url: 'https://cloudflare-dns.com/dns-query' },
  { id: 'google', name: '🔍 Google DNS', url: 'https://dns.google/resolve' },
  { id: 'quad9', name: '🛡️ Quad9', url: 'https://dns.quad9.net:5053/dns-query' },
  { id: 'ali', name: '🐘 阿里 DNS', url: 'https://dns.alidns.com/dns-query' },
  { id: 'dnspod', name: '🐧 DNSPod', url: 'https://doh.pub/dns-query' },
];

const recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'];

const typeMap: Record<string, number> = {
  A: 1, AAAA: 28, CNAME: 5, MX: 15, TXT: 16, NS: 2,
};

const domainInput = ref('');
const recordType = ref('A');
const loading = ref(false);
const error = ref('');
const queryResults = ref<ProviderResult[]>([]);

// 统计所有成功的记录值，用于判断"多数/少数"
function findAllValues(): string[] {
  const all: string[] = [];
  for (const r of queryResults.value) {
    if (r.ok) {
      for (const rec of r.records) {
        all.push(rec.data);
      }
    }
  }
  return all;
}

const uniqueIpCount = computed(() => {
  const vals = findAllValues();
  return new Set(vals).size;
});

// 多数值：出现次数最多的值
const majorityValue = computed(() => {
  const vals = findAllValues();
  if (vals.length === 0) return null;
  const freq: Record<string, number> = {};
  let max = 0, maxVal = vals[0];
  for (const v of vals) {
    freq[v] = (freq[v] || 0) + 1;
    if (freq[v] > max) { max = freq[v]; maxVal = v; }
  }
  // 需要至少出现 2 次才算"多数"
  return max >= 2 ? maxVal : null;
});

// 判断某个结果是否与多数一致
function isMatch(result: ProviderResult): boolean {
  if (!result.ok || result.records.length === 0) return false;
  const m = majorityValue.value;
  if (!m) return true; // 没有多数值，全部算一致
  return result.records.some(r => r.data === m);
}

// 所有成功的结果是否都一样
const consensusAllMatch = computed(() => {
  const okResults = queryResults.value.filter(r => r.ok && r.records.length > 0);
  if (okResults.length <= 1) return true;
  const firstSet = new Set(okResults[0].records.map(r => r.data));
  for (let i = 1; i < okResults.length; i++) {
    const curSet = new Set(okResults[i].records.map(r => r.data));
    if (firstSet.size !== curSet.size) return false;
    for (const v of firstSet) {
      if (!curSet.has(v)) return false;
    }
  }
  return true;
});

// 记录背景色：多数值绿色，非多数黄色，唯一值灰色
function getRecordBgColor(rec: DnsRecord, allRecs: DnsRecord[]): string {
  const m = majorityValue.value;
  if (!m) return 'var(--color-bg-primary)';
  if (rec.data === m) return '#dcfce7';
  // 只有一条记录且不等于多数
  if (allRecs.length === 1) return '#fef3c7';
  return '#f3f4f6';
}

async function querySingleProvider(
  providerId: string,
  providerName: string,
  baseUrl: string,
  domain: string,
  type: string
): Promise<ProviderResult> {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `${baseUrl}?name=${encodeURIComponent(domain)}&type=${typeMap[type] || 1}`,
      {
        headers: { Accept: 'application/dns-json' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    const duration = Math.round(performance.now() - start);

    if (!res.ok) {
      return { providerId, providerName, ok: false, records: [], errorMsg: `HTTP ${res.status}`, duration };
    }

    const data = await res.json();
    if (data.Status !== 0) {
      return { providerId, providerName, ok: false, records: [], errorMsg: `DNS RCODE ${data.Status}`, duration };
    }

    const records: DnsRecord[] = [...(data.Answer || []), ...(data.Authority || [])];
    return { providerId, providerName, ok: true, records, errorMsg: '', duration };
  } catch (e: any) {
    const duration = Math.round(performance.now() - start);
    let msg = '请求失败';
    if (e.name === 'AbortError') msg = '请求超时';
    else if (e.message) msg = e.message;
    return { providerId, providerName, ok: false, records: [], errorMsg: msg, duration };
  }
}

async function checkPropagation() {
  const domain = domainInput.value.trim();
  if (!domain) {
    error.value = '请输入域名';
    return;
  }

  loading.value = true;
  error.value = '';
  queryResults.value = [];

  // 并发查询所有服务商
  const promises = providers.map(p =>
    querySingleProvider(p.id, p.name, p.url, domain, recordType.value)
  );
  const results = await Promise.all(promises);

  queryResults.value = results;
  loading.value = false;

  // 检查是否全部失败
  if (results.every(r => !r.ok)) {
    error.value = '所有 DNS 服务商均查询失败，请检查域名是否正确';
  }
}
</script>
