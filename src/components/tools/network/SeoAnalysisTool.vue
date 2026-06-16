<template>
  <div class="space-y-4">
    <!-- 输入区域 -->
    <div class="flex gap-2">
      <input
        v-model="urlInput"
        type="text"
        placeholder="输入网址，例如: https://example.com"
        class="flex-1 rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        @keyup.enter="startAnalysis"
      />
      <button
        @click="startAnalysis"
        :disabled="loading"
        class="px-5 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
        style="background-color: var(--color-primary);"
      >
        {{ loading ? '分析中...' : '开始分析' }}
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <svg class="animate-spin h-6 w-6" style="color: var(--color-primary);" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span class="ml-2 text-sm" style="color: var(--color-text-muted);">正在分析 {{ loadingStep }}...</span>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm" style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b;">
      <span>{{ error }}</span>
    </div>

    <!-- 域名摘要卡片 -->
    <div v-if="domainInfo" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="rounded-lg border p-3 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
        <div class="text-2xl font-bold" style="color: var(--color-primary);">{{ dnsIP || '-' }}</div>
        <div class="text-xs mt-1" style="color: var(--color-text-muted);">服务器 IP</div>
      </div>
      <div class="rounded-lg border p-3 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
        <div class="text-2xl font-bold" style="color: var(--color-primary);">{{ dnsCountry || '-' }}</div>
        <div class="text-xs mt-1" style="color: var(--color-text-muted);">IP 归属地</div>
      </div>
      <div class="rounded-lg border p-3 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
        <div class="text-2xl font-bold" style="color: var(--color-primary);">{{ sslInfo ? '✅' : '❓' }}</div>
        <div class="text-xs mt-1" style="color: var(--color-text-muted);">SSL 证书</div>
      </div>
      <div class="rounded-lg border p-3 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
        <div class="text-2xl font-bold" style="color: var(--color-primary);">{{ dnsRecordCount }}</div>
        <div class="text-xs mt-1" style="color: var(--color-text-muted);">DNS 记录数</div>
      </div>
    </div>

    <!-- 标签切换 -->
    <div v-if="domainInfo" class="pt-2">
      <TabView :tabs="tabs">
        <!-- Tab 0: 域名信息 -->
        <template #tab-0>
          <div class="space-y-4">
            <!-- DNS 记录 -->
            <div>
              <h3 class="text-sm font-medium mb-2" style="color: var(--color-text);">DNS 解析记录</h3>
              <div class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
                <table class="w-full text-sm">
                  <thead>
                    <tr style="border-bottom: 1px solid var(--color-border);">
                      <th class="px-4 py-2 text-left font-medium" style="background-color: var(--color-bg-secondary);">记录类型</th>
                      <th class="px-4 py-2 text-left font-medium" style="background-color: var(--color-bg-secondary);">Name</th>
                      <th class="px-4 py-2 text-left font-medium" style="background-color: var(--color-bg-secondary);">Value</th>
                      <th class="px-4 py-2 text-left font-medium" style="background-color: var(--color-bg-secondary);">TTL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(rec, idx) in allDnsRecords" :key="idx" :style="idx < allDnsRecords.length - 1 ? 'border-bottom: 1px solid var(--color-border);' : ''">
                      <td class="px-4 py-2">
                        <span class="px-1.5 py-0.5 rounded text-xs font-medium text-white" :style="{ backgroundColor: dnsTypeColor(rec.type) }">{{ rec.typeName }}</span>
                      </td>
                      <td class="px-4 py-2 text-xs font-mono" style="color: var(--color-text);">{{ rec.name }}</td>
                      <td class="px-4 py-2">
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs font-mono" style="color: var(--color-text); word-break: break-all;">{{ rec.data }}</span>
                          <CopyButton :text="rec.data" />
                        </div>
                      </td>
                      <td class="px-4 py-2 text-xs" style="color: var(--color-text-secondary);">{{ rec.TTL }}s</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- WHOIS / IP 信息 -->
            <div v-if="ipInfo" class="grid grid-cols-2 gap-3">
              <div v-for="(val, key) in ipInfo" :key="key" class="rounded-md border px-3 py-2" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
                <span class="text-xs" style="color: var(--color-text-muted);">{{ key }}</span>
                <p class="text-sm mt-0.5" style="color: var(--color-text);">{{ val || '-' }}</p>
              </div>
            </div>
          </div>
        </template>

        <!-- Tab 1: 页面 Meta -->
        <template #tab-1>
          <div class="space-y-4">
            <!-- 抓取提示 -->
            <div class="flex items-center gap-2 px-3 py-2 rounded-md text-xs" style="background-color: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25); color: #92400e;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>页面抓取可能因 CORS 限制而失败，可切换到「手动输入 HTML」模式粘贴源码分析。</span>
            </div>

            <div class="flex items-center gap-2">
              <label class="text-xs font-medium" style="color: var(--color-text-secondary);">分析模式:</label>
              <button
                @click="metaMode = 'fetch'"
                class="text-xs px-3 py-1 rounded-md border transition-colors"
                :style="metaMode === 'fetch' ? 'background-color: var(--color-primary); color: #fff; border-color: var(--color-primary);' : 'background-color: var(--color-bg-secondary); color: var(--color-text); border-color: var(--color-border);'"
              >URL 抓取</button>
              <button
                @click="metaMode = 'manual'"
                class="text-xs px-3 py-1 rounded-md border transition-colors"
                :style="metaMode === 'manual' ? 'background-color: var(--color-primary); color: #fff; border-color: var(--color-primary);' : 'background-color: var(--color-bg-secondary); color: var(--color-text); border-color: var(--color-border);'"
              >手动输入 HTML</button>
            </div>

            <!-- URL 抓取模式 -->
            <div v-if="metaMode === 'fetch'">
              <div class="flex gap-2">
                <input v-model="metaUrl" type="text" placeholder="输入页面完整 URL" class="flex-1 rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
                <button @click="fetchPageMeta" :disabled="metaLoading" class="px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50" style="background-color: var(--color-primary);">{{ metaLoading ? '抓取中...' : '抓取' }}</button>
              </div>
              <p class="text-xs mt-1" style="color: var(--color-text-muted);">提示：通过公开 CORS 代理抓取，部分网站可能无法正常获取。</p>
            </div>

            <!-- 手动 HTML 模式 -->
            <div v-if="metaMode === 'manual'">
              <textarea v-model="manualHtml" placeholder="在此粘贴 HTML 源码..." :rows="8" class="w-full rounded-md border px-3 py-2 text-xs font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"></textarea>
              <button @click="analyzeManualHtml" :disabled="!manualHtml.trim()" class="mt-2 px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50" style="background-color: var(--color-primary);">分析 HTML</button>
            </div>

            <!-- Meta 分析结果 -->
            <div v-if="pageMeta" class="space-y-3">
              <!-- SEO 评分 -->
              <div class="grid grid-cols-4 gap-3">
                <div v-for="score in seoScores" :key="score.label" class="rounded-lg border p-3 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
                  <div class="text-xl font-bold" :style="{ color: score.color }">{{ score.value }}</div>
                  <div class="text-xs mt-1" style="color: var(--color-text-muted);">{{ score.label }}</div>
                </div>
              </div>

              <!-- 基础 Meta -->
              <div>
                <h3 class="text-sm font-medium mb-2" style="color: var(--color-text);">基础 Meta 标签</h3>
                <div class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
                  <table class="w-full text-sm">
                    <thead>
                      <tr style="border-bottom: 1px solid var(--color-border);">
                        <th class="px-4 py-2 text-left font-medium w-32" style="background-color: var(--color-bg-secondary);">属性</th>
                        <th class="px-4 py-2 text-left font-medium" style="background-color: var(--color-bg-secondary);">内容</th>
                        <th class="px-4 py-2 text-center font-medium w-20" style="background-color: var(--color-bg-secondary);">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, idx) in metaTable" :key="idx" :style="idx < metaTable.length - 1 ? 'border-bottom: 1px solid var(--color-border);' : ''">
                        <td class="px-4 py-2 text-xs" style="color: var(--color-text-secondary);">{{ item.label }}</td>
                        <td class="px-4 py-2">
                          <span class="text-xs font-mono" :style="{ color: item.value ? 'var(--color-text)' : 'var(--color-text-muted)' }">
                            {{ item.value || '(缺失)' }}
                          </span>
                        </td>
                        <td class="px-4 py-2 text-center">
                          <span v-if="item.ok" class="text-xs" style="color: #16a34a;">✅</span>
                          <span v-else class="text-xs" style="color: #dc2626;">❌</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- H 标签结构 -->
              <div>
                <h3 class="text-sm font-medium mb-2" style="color: var(--color-text);">H 标签结构</h3>
                <div class="space-y-1">
                  <div v-for="h in pageMeta.headings" :key="h.level + h.text" class="flex items-center gap-2 rounded border px-3 py-1.5" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
                    <span class="text-xs font-bold px-1.5 py-0.5 rounded" style="background-color: var(--color-primary); color: #fff;">{{ h.level }}</span>
                    <span class="text-xs" style="color: var(--color-text);">{{ h.text || '(空)' }}</span>
                  </div>
                  <div v-if="pageMeta.headings.length === 0" class="text-xs py-2" style="color: var(--color-text-muted);">未检测到 H 标签</div>
                </div>
              </div>

              <!-- Open Graph -->
              <div v-if="pageMeta.og && Object.keys(pageMeta.og).length > 0">
                <h3 class="text-sm font-medium mb-2" style="color: var(--color-text);">Open Graph</h3>
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="(val, key) in pageMeta.og" :key="key" class="rounded border px-3 py-2" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
                    <span class="text-xs" style="color: var(--color-text-muted);">{{ key }}</span>
                    <p class="text-xs font-mono mt-0.5 break-all" style="color: var(--color-text);">{{ val }}</p>
                  </div>
                </div>
              </div>

              <!-- 图片列表 -->
              <div v-if="pageMeta.images && pageMeta.images.length > 0">
                <h3 class="text-sm font-medium mb-2" style="color: var(--color-text);">页面图片 ({{ pageMeta.images.length }} 张)</h3>
                <div class="space-y-1 max-h-60 overflow-y-auto">
                  <div v-for="(img, idx) in pageMeta.images" :key="idx" class="flex items-center gap-2 rounded border px-3 py-1.5" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
                    <span class="text-xs" :style="{ color: img.alt ? 'var(--color-text)' : 'var(--color-text-muted)' }">
                      {{ img.alt ? '✅' : '❌' }}
                    </span>
                    <span class="text-xs font-mono flex-1 truncate" style="color: var(--color-text);">{{ img.src }}</span>
                    <span v-if="!img.alt" class="text-xs whitespace-nowrap" style="color: #dc2626;">缺少 alt</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Tab 2: 性能分析 -->
        <template #tab-2>
          <div class="space-y-4">
            <div class="flex items-center gap-2 px-3 py-2 rounded-md text-xs" style="background-color: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25); color: #1e40af;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>性能分析通过打开新窗口测量实际加载指标，请确保浏览器允许弹窗。</span>
            </div>

            <div class="flex gap-2">
              <input
                v-model="perfUrl"
                type="text"
                placeholder="输入要测试的完整 URL"
                class="flex-1 rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
                style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
                @keyup.enter="openPerformanceTest"
              />
              <button
                @click="openPerformanceTest"
                :disabled="perfLoading"
                class="px-5 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
                style="background-color: var(--color-primary);"
              >
                {{ perfLoading ? '测试中...' : '打开测试' }}
              </button>
            </div>

            <div v-if="perfResult" class="space-y-3">
              <div class="grid grid-cols-3 gap-3">
                <div class="rounded-lg border p-4 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
                  <div class="text-3xl font-bold" :style="{ color: getPerfColor(perfResult.pageLoad) }">{{ perfResult.pageLoad }}ms</div>
                  <div class="text-xs mt-1" style="color: var(--color-text-muted);">页面加载时间</div>
                </div>
                <div class="rounded-lg border p-4 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
                  <div class="text-3xl font-bold" :style="{ color: getPerfColor(perfResult.domReady) }">{{ perfResult.domReady }}ms</div>
                  <div class="text-xs mt-1" style="color: var(--color-text-muted);">DOM Ready</div>
                </div>
                <div class="rounded-lg border p-4 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
                  <div class="text-3xl font-bold" :style="{ color: getPerfColor(perfResult.requests) }">{{ perfResult.requests }}</div>
                  <div class="text-xs mt-1" style="color: var(--color-text-muted);">资源请求数</div>
                </div>
              </div>
            </div>

            <div class="rounded-md border p-4 space-y-3" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
              <h3 class="text-sm font-medium" style="color: var(--color-text);">SEO 基础检查清单</h3>
              <div class="space-y-2">
                <div v-for="check in seoChecklist" :key="check.label" class="flex items-center gap-2 text-sm">
                  <span>{{ check.ok ? '✅' : '❌' }}</span>
                  <span style="color: var(--color-text-secondary);">{{ check.label }}</span>
                  <span v-if="check.detail" class="text-xs" style="color: var(--color-text-muted);">— {{ check.detail }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </TabView>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TabView from '../../common/TabView.vue';
import CopyButton from '../../common/CopyButton.vue';

// ---- 输入 ----
const urlInput = ref('');
const loading = ref(false);
const loadingStep = ref('');
const error = ref('');

// ---- 域名信息 ----
const domainInfo = ref(false);
const dnsIP = ref('');
const dnsCountry = ref('');
const dnsRecordCount = ref(0);
const sslInfo = ref('');
const allDnsRecords = ref<any[]>([]);
const ipInfo = ref<Record<string, string> | null>(null);

// ---- Meta 分析 ----
const tabs = ['域名信息', '页面 Meta', '性能分析'];
const metaMode = ref<'fetch' | 'manual'>('fetch');
const metaUrl = ref('');
const metaLoading = ref(false);
const manualHtml = ref('');
const pageMeta = ref<any>(null);

// ---- 性能 ----
const perfUrl = ref('');
const perfLoading = ref(false);
const perfResult = ref<any>(null);

const typeMap: Record<number, string> = {
  1: 'A', 2: 'NS', 5: 'CNAME', 6: 'SOA', 15: 'MX', 16: 'TXT', 28: 'AAAA', 33: 'SRV', 257: 'CAA',
};

function dnsTypeColor(type: number): string {
  const colors: Record<number, string> = { 1:'#2563eb', 28:'#7c3aed', 5:'#d97706', 15:'#059669', 16:'#0891b2', 2:'#dc2626', 6:'#9333ea', 33:'#ea580c', 257:'#be185d' };
  return colors[type] || '#6b7280';
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.hostname;
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0].split('?')[0];
  }
}

// ---- DNS / IP 查询 ----
async function startAnalysis() {
  const url = urlInput.value.trim();
  if (!url) { error.value = '请输入网址'; return; }

  const domain = extractDomain(url);
  metaUrl.value = 'https://' + domain;
  perfUrl.value = 'https://' + domain;

  loading.value = true;
  error.value = '';
  domainInfo.value = false;

  // Step 1: DNS records
  loadingStep.value = 'DNS 记录';
  allDnsRecords.value = [];
  const recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA'];
  for (const rt of recordTypes) {
    try {
      const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${rt}`, {
        headers: { Accept: 'application/dns-json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.Answer) {
          for (const r of data.Answer) {
            allDnsRecords.value.push({
              ...r,
              typeName: typeMap[r.type] || `TYPE${r.type}`,
              data: r.data.replace(/\.$/, ''),
            });
          }
        }
      }
    } catch {}
    await new Promise(r => setTimeout(r, 80));
  }
  dnsRecordCount.value = allDnsRecords.value.length;
  const aRecord = allDnsRecords.value.find(r => r.type === 1);
  dnsIP.value = aRecord ? aRecord.data : '-';

  // Step 2: IP 归属地 via ip-api.com
  if (dnsIP.value && dnsIP.value !== '-') {
    loadingStep.value = 'IP 归属地';
    try {
      const ipRes = await fetch(`https://ipapi.co/${dnsIP.value}/json/`);
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        dnsCountry.value = [ipData.country_name, ipData.city].filter(Boolean).join(' ') || '-';
        ipInfo.value = { '国家/地区': ipData.country_name, '城市': ipData.city, 'ISP': ipData.org, 'ASN': ipData.asn, '时区': ipData.timezone };
      }
    } catch {}
  }

  domainInfo.value = true;
  loading.value = false;

  // 自动尝试抓取页面 Meta
  loadingStep.value = '页面信息';
  metaMode.value = 'fetch';
  setTimeout(() => fetchPageMeta(), 300);
}

// ---- 页面 Meta 抓取 ----
async function fetchPageMeta() {
  const url = metaUrl.value.trim();
  if (!url) return;
  metaLoading.value = true;
  try {
    // 用 allorigins 作为 CORS 代理
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    parseHtml(html);
  } catch (e: any) {
    // allorigins 失败，尝试直接 fetch
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const html = await res.text();
        parseHtml(html);
      } else {
        error.value = `页面抓取失败：服务器返回 ${res.status}。请切换到「手动输入 HTML」模式。`;
      }
    } catch (e2: any) {
      error.value = `无法抓取页面（CORS 限制或网络错误）。请切换到「手动输入 HTML」模式，直接粘贴网页源码进行分析。`;
    }
  } finally {
    metaLoading.value = false;
  }
}

function analyzeManualHtml() {
  if (!manualHtml.value.trim()) return;
  parseHtml(manualHtml.value);
}

function parseHtml(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Title
  const title = doc.querySelector('title')?.textContent?.trim() || '';
  const titleLen = title.length;
  const titleOk = titleLen >= 10 && titleLen <= 70;

  // Description
  const descEl = doc.querySelector('meta[name="description"]');
  const description = descEl?.getAttribute('content')?.trim() || '';
  const descLen = description.length;
  const descOk = descLen >= 50 && descLen <= 160;

  // Keywords
  const keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content')?.trim() || '';

  // Canonical
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || '';

  // Robots
  const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content')?.trim() || '';
  const robotsOk = !robots.toLowerCase().includes('noindex');

  // Hreflang
  const hreflang = doc.querySelectorAll('link[rel="alternate"][hreflang]');
  const hreflangCount = hreflang.length;

  // Favicon
  const faviconOk = !!doc.querySelector('link[rel="icon"]') || !!doc.querySelector('link[rel="shortcut icon"]');

  // Structured data
  const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const schemaOk = schemaScripts.length > 0;
  const schemaCount = schemaScripts.length;

  // H tags
  const headings: { level: string; text: string }[] = [];
  for (let i = 1; i <= 6; i++) {
    doc.querySelectorAll(`h${i}`).forEach(h => {
      headings.push({ level: `H${i}`, text: h.textContent?.trim().substring(0, 120) || '' });
    });
  }
  const hasH1 = headings.some(h => h.level === 'H1');
  const h1Count = headings.filter(h => h.level === 'H1').length;

  // Open Graph
  const og: Record<string, string> = {};
  doc.querySelectorAll('meta[property^="og:"]').forEach(el => {
    const prop = el.getAttribute('property')?.replace('og:', '') || '';
    const content = el.getAttribute('content') || '';
    if (prop && content) og[prop] = content;
  });

  // Images
  const images: { src: string; alt: string }[] = [];
  doc.querySelectorAll('img').forEach(img => {
    images.push({
      src: img.getAttribute('src') || '',
      alt: img.getAttribute('alt') || '',
    });
  });
  const imagesWithoutAlt = images.filter(i => !i.alt).length;

  // Links
  const internalLinks = doc.querySelectorAll('a[href]:not([href^="http"]):not([href^="//"])').length;
  const externalLinks = doc.querySelectorAll('a[href^="http"]').length;
  const totalLinks = internalLinks + externalLinks;

  // Viewport
  const viewportOk = !!doc.querySelector('meta[name="viewport"]');

  // Charset
  const charset = doc.querySelector('meta[charset]')?.getAttribute('charset') || doc.querySelector('meta[http-equiv="Content-Type"]')?.getAttribute('content') || '';

  pageMeta.value = {
    title, description, keywords, canonical, robots, headings, og, images,
    hreflangCount, schemaCount, imagesWithoutAlt, totalLinks, internalLinks, externalLinks,
  };

  // 更新 metaTable
  metaTable.value = [
    { label: 'Title', value: title, ok: titleOk, detail: titleOk ? '长度合理' : titleLen < 10 ? '太短（建议 10-70 字符）' : '太长（建议 10-70 字符）' },
    { label: 'Meta Description', value: description, ok: descOk, detail: descOk ? '长度合理' : descLen < 50 ? '太短（建议 50-160 字符）' : '太长（建议 50-160 字符）' },
    { label: 'Meta Keywords', value: keywords, ok: true },
    { label: 'Canonical', value: canonical, ok: !!canonical },
    { label: 'Robots', value: robots || '(未设置)', ok: robotsOk },
    { label: 'Viewport', value: viewportOk ? '已设置' : '(缺失)', ok: viewportOk },
    { label: 'Charset', value: charset, ok: !!charset },
    { label: 'H1 标签', value: hasH1 ? `${h1Count} 个` : '(缺失)', ok: hasH1 && h1Count === 1, detail: h1Count > 1 ? '建议仅保留 1 个 H1' : '' },
    { label: 'Favicon', value: faviconOk ? '已设置' : '(缺失)', ok: faviconOk },
    { label: '结构化数据', value: schemaOk ? `${schemaCount} 个 Schema` : '(缺失)', ok: schemaOk },
    { label: 'Hreflang', value: hreflangCount > 0 ? `${hreflangCount} 个语言版本` : '(未设置)', ok: true },
    { label: 'OG Title', value: og['title'] || '(缺失)', ok: !!og['title'] },
    { label: 'OG Description', value: og['description'] || '(缺失)', ok: !!og['description'] },
    { label: 'OG Image', value: og['image'] || '(缺失)', ok: !!og['image'] },
    { label: '图片总数', value: `${images.length} 张`, ok: imagesWithoutAlt === 0, detail: imagesWithoutAlt > 0 ? `${imagesWithoutAlt} 张缺少 alt` : '' },
    { label: '链接', value: `内链 ${internalLinks} / 外链 ${externalLinks}`, ok: totalLinks > 0 },
  ];

  seoScores.value = [
    { label: 'Meta 评分', value: `${metaScore.value}/100`, color: metaScore.value >= 80 ? '#16a34a' : metaScore.value >= 50 ? '#d97706' : '#dc2626' },
    { label: 'Title', value: titleOk ? '合格' : '需优化', color: titleOk ? '#16a34a' : '#dc2626' },
    { label: 'Description', value: descOk ? '合格' : '需优化', color: descOk ? '#16a34a' : '#dc2626' },
    { label: 'H1', value: hasH1 && h1Count === 1 ? '合格' : '需优化', color: hasH1 && h1Count === 1 ? '#16a34a' : h1Count > 1 ? '#d97706' : '#dc2626' },
  ];

  seoChecklist.value = [
    { label: 'Title 标签', ok: titleOk, detail: titleOk ? `${titleLen} 字符` : titleLen === 0 ? '缺失' : `${titleLen} 字符 - 建议 10-70` },
    { label: 'Meta Description', ok: descOk, detail: descOk ? `${descLen} 字符` : descLen === 0 ? '缺失' : `${descLen} 字符 - 建议 50-160` },
    { label: 'H1 标签', ok: hasH1 && h1Count === 1, detail: h1Count > 1 ? '有多个 H1' : !hasH1 ? '缺失' : '' },
    { label: 'Canonical URL', ok: !!canonical, detail: !canonical ? '未设置' : '' },
    { label: 'Robots（可索引）', ok: robotsOk, detail: !robotsOk ? '包含 noindex' : '' },
    { label: 'Viewport（移动端适配）', ok: viewportOk, detail: !viewportOk ? '未设置' : '' },
    { label: 'Favicon', ok: faviconOk, detail: !faviconOk ? '未设置' : '' },
    { label: '结构化数据（Schema）', ok: schemaOk, detail: !schemaOk ? '未检测到' : '' },
    { label: 'OG 社交分享标签', ok: !!og['title'] && !!og['image'], detail: !og['title'] ? '缺少 og:title' : !og['image'] ? '缺少 og:image' : '' },
    { label: '图片 Alt 属性', ok: imagesWithoutAlt === 0, detail: imagesWithoutAlt > 0 ? `${imagesWithoutAlt} 张图片无 alt` : '' },
  ];
}

// ---- 响应式状态 ----
const metaTable = ref<any[]>([]);
const seoScores = ref<any[]>([]);
const seoChecklist = ref<any[]>([]);

const metaScore = computed(() => {
  if (!metaTable.value.length) return 0;
  const total = metaTable.value.length;
  const ok = metaTable.value.filter(item => item.ok).length;
  return Math.round((ok / total) * 100);
});

// ---- 性能测试 ----
function openPerformanceTest() {
  const url = perfUrl.value.trim();
  if (!url) return;
  perfLoading.value = true;
  perfResult.value = null;

  const fullUrl = url.startsWith('http') ? url : 'https://' + url;
  const startTime = performance.now();

  // 打开新窗口进行性能测试
  const win = window.open(fullUrl, '_blank', 'width=800,height=600');
  if (!win) {
    error.value = '弹窗被拦截，请允许本站弹窗后重试。';
    perfLoading.value = false;
    return;
  }

  // 轮询检测加载完成
  const checkInterval = setInterval(() => {
    try {
      if (win.document.readyState === 'complete') {
        clearInterval(checkInterval);
        const endTime = performance.now();
        const loadTime = Math.round(endTime - startTime);

        try {
          const perfData = win.performance.timing;
          const domReady = perfData.domContentLoadedEventEnd - perfData.navigationStart;
          const entries = win.performance.getEntriesByType('resource');

          perfResult.value = {
            pageLoad: loadTime,
            domReady: Math.round(domReady) || loadTime,
            requests: entries.length,
          };
        } catch {
          perfResult.value = {
            pageLoad: loadTime,
            domReady: loadTime,
            requests: -1,
          };
        }

        win.close();
        perfLoading.value = false;
      }
    } catch {
      // 跨域页面无法访问 document，仅记录打开时间
      clearInterval(checkInterval);
      setTimeout(() => {
        const endTime = performance.now();
        const loadTime = Math.round(endTime - startTime);
        perfResult.value = { pageLoad: loadTime, domReady: loadTime, requests: -1 };
        try { win.close(); } catch {}
        perfLoading.value = false;
      }, 2000);
    }
  }, 200);

  // 超时保护
  setTimeout(() => {
    clearInterval(checkInterval);
    if (!perfResult.value) {
      perfResult.value = { pageLoad: -1, domReady: -1, requests: -1 };
      perfLoading.value = false;
      try { win.close(); } catch {}
    }
  }, 30000);
}

function getPerfColor(val: number): string {
  if (val < 0) return 'var(--color-text-muted)';
  if (val < 1000) return '#16a34a';
  if (val < 3000) return '#d97706';
  return '#dc2626';
}
</script>
