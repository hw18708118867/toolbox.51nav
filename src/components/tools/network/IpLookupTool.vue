<template>
  <div class="space-y-4">
    <!-- 输入区 -->
    <div class="flex gap-2">
      <input
        v-model="ipInput"
        type="text"
        placeholder="输入 IP 或域名查询，例如: 8.8.8.8 或 baidu.com"
        class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        @keyup.enter="lookup"
      />
      <button
        @click="lookup"
        :disabled="loading"
        class="px-5 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
        style="background-color: var(--color-primary);"
      >
        {{ loading ? '查询中...' : '查询' }}
      </button>
    </div>

    <!-- 自动检测提示 -->
    <div v-if="!result && !loading && !error" class="flex items-center gap-2 text-xs" style="color: var(--color-text-muted);">
      <svg class="animate-spin h-3 w-3" viewBox="0 0 24 24" v-if="autoDetecting">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span>{{ autoDetecting ? '正在检测您的 IP 地址...' : '输入 IP 地址后点击查询，留空可查当前 IP' }}</span>
    </div>

    <!-- 加载 -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <svg class="animate-spin h-6 w-6" style="color: var(--color-primary);" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span class="ml-2 text-sm" style="color: var(--color-text-muted);">查询中...</span>
    </div>

    <!-- 错误 -->
    <div v-if="error" class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm" style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- 结果 -->
    <div v-if="result && !loading" class="space-y-4">
      <!-- 地图 -->
      <div class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
        <div ref="mapContainer" class="w-full" style="height: 280px;"></div>
      </div>

      <!-- 标签 -->
      <div class="flex flex-wrap gap-2">
        <span class="px-2.5 py-1 rounded text-xs font-medium" style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary);">
          {{ result.version || 'IPv4' }}
        </span>
        <span class="px-2.5 py-1 rounded text-xs font-medium" style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary);">
          🌍 {{ result.continent_code }} / {{ result.country_code }}
        </span>
        <span v-if="result.in_eu" class="px-2.5 py-1 rounded text-xs font-medium text-white" style="background-color: #7c3aed;">
          🇪🇺 欧盟
        </span>
      </div>

      <!-- 信息网格 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <!-- 位置信息 -->
        <div class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
          <h3 class="text-xs font-bold mb-3 flex items-center gap-1.5" style="color: var(--color-text-secondary);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            位置信息
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">国家/地区</span>
              <span class="font-medium" style="color: var(--color-text);">
                {{ result.countryFlag }} {{ result.country_name }}
                <CopyButton :text="result.country_name" />
              </span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">首都</span>
              <span class="font-medium" style="color: var(--color-text);">{{ result.country_capital || '-' }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">省/州</span>
              <span class="font-medium" style="color: var(--color-text);">{{ result.region || '-' }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">城市</span>
              <span class="font-medium" style="color: var(--color-text);">{{ result.city || '-' }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">邮编</span>
              <span class="font-medium" style="color: var(--color-text);">{{ result.postal || '-' }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">经纬度</span>
              <span class="font-medium font-mono" style="color: var(--color-text);">{{ result.latitude }}, {{ result.longitude }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">时区</span>
              <span class="font-medium" style="color: var(--color-text);">{{ result.timezone || '-' }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">货币</span>
              <span class="font-medium" style="color: var(--color-text);">{{ result.currency_name || result.currency }} ({{ result.currency }})</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">语言</span>
              <span class="font-medium" style="color: var(--color-text);">{{ result.languages || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 网络信息 -->
        <div class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
          <h3 class="text-xs font-bold mb-3 flex items-center gap-1.5" style="color: var(--color-text-secondary);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
            网络信息
          </h3>
          <div class="space-y-2">
            <div v-if="result.resolvedDomain" class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">查询域名</span>
              <span class="font-medium" style="color: var(--color-text);">
                {{ result.resolvedDomain }}
                <CopyButton :text="result.resolvedDomain" />
              </span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">解析 IP</span>
              <span class="font-medium font-mono" style="color: var(--color-primary);">
                {{ result.ip }}
                <CopyButton :text="result.ip" />
              </span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">IP 版本</span>
              <span class="font-medium" style="color: var(--color-text);">{{ result.version || '-' }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">IP 段</span>
              <span class="font-medium font-mono" style="color: var(--color-text);">{{ result.network || '-' }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">ISP / 组织机构</span>
              <span class="font-medium" style="color: var(--color-text);">{{ result.org || '-' }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">ASN</span>
              <span class="font-medium font-mono" style="color: var(--color-text);">{{ result.asn || '-' }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">国家 TLD</span>
              <span class="font-medium" style="color: var(--color-text);">{{ result.country_tld || '-' }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span style="color: var(--color-text-muted);">电话区号</span>
              <span class="font-medium" style="color: var(--color-text);">{{ result.country_calling_code || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部说明 -->
      <p class="text-xs text-center" style="color: var(--color-text-muted);">
        数据由 <a href="https://ipapi.co" target="_blank" class="underline" style="color: var(--color-primary);">ipapi.co</a> 提供 ·
        HTTPS · 1000次/天
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import CopyButton from '../../common/CopyButton.vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ====== 类型 ======
interface IpResult {
  ip: string;
  resolvedDomain?: string;
  network: string;
  version: string;
  city: string;
  region: string;
  region_code: string;
  country: string;
  country_name: string;
  country_code: string;
  country_code_iso3: string;
  country_capital: string;
  country_tld: string;
  continent_code: string;
  in_eu: boolean;
  postal: string;
  latitude: number;
  longitude: number;
  timezone: string;
  utc_offset: string;
  country_calling_code: string;
  currency: string;
  currency_name: string;
  languages: string;
  country_area: number;
  country_population: number;
  asn: string;
  org: string;
  countryFlag: string;
}

// ====== 状态 ======
const ipInput = ref('');
const loading = ref(false);
const autoDetecting = ref(true);
const error = ref('');
const result = ref<IpResult | null>(null);
const mapContainer = ref<HTMLElement | null>(null);

let mapInstance: L.Map | null = null;
let marker: L.Marker | null = null;

// ====== 国家旗帜 ======
function makeFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(0x1F1E6 + code.charCodeAt(0) - 65) +
         String.fromCodePoint(0x1F1E6 + code.charCodeAt(1) - 65);
}

// ====== 地图 ======
function initMap() {
  if (!mapContainer.value || !result.value) return;
  destroyMap();

  const lat = result.value.latitude;
  const lon = result.value.longitude;

  mapInstance = L.map(mapContainer.value, {
    center: [lat, lon],
    zoom: 12,
    zoomControl: true,
    attributionControl: false,
  });

  // 使用 CartoDB 轻量瓦片
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(mapInstance);

  // 定位标记
  const icon = L.divIcon({
    className: 'ip-marker',
    html: `<div style="width:20px;height:20px;background:var(--color-primary, #2563eb);border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  marker = L.marker([lat, lon], { icon }).addTo(mapInstance);
  marker.bindPopup(`
    <b>${result.value.city || 'Unknown'}, ${result.value.country_name}</b><br>
    ${result.value.org || ''}<br>
    <code>${result.value.ip}</code>
  `);

  // 精度圈
  L.circle([lat, lon], {
    radius: 2000,
    color: 'var(--color-primary, #2563eb)',
    fillColor: 'var(--color-primary, #2563eb)',
    fillOpacity: 0.08,
    weight: 1,
  }).addTo(mapInstance);
}

function destroyMap() {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    marker = null;
  }
}

watch(result, async (val) => {
  if (val) {
    await nextTick();
    initMap();
  }
});

onBeforeUnmount(() => destroyMap());

// ====== 查询 ======
function isDomain(input: string): boolean {
  // IP 格式检测（IPv4 或 IPv6）
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  if (ipv4.test(input) || ipv6.test(input)) return false;
  // 包含非数字非冒号字符，视为域名
  return /[a-zA-Z]/.test(input) || input.includes('.');
}

async function resolveDomain(domain: string): Promise<string> {
  const res = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`,
    { headers: { Accept: 'application/dns-json' } }
  );
  if (!res.ok) throw new Error(`DNS 解析失败 (HTTP ${res.status})`);
  const data = await res.json();
  if (!data.Answer || data.Answer.length === 0) {
    throw new Error(`域名 ${domain} 未找到 A 记录`);
  }
  // 取第一条 A 记录
  return data.Answer[0].data;
}

async function detectMyIp() {
  autoDetecting.value = true;
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    if (data.ip) {
      ipInput.value = data.ip;
      await doLookup(data.ip);
    }
  } catch {
    // 自动检测失败，静默
  } finally {
    autoDetecting.value = false;
  }
}

async function lookup() {
  const input = ipInput.value.trim();
  if (!input) {
    // 留空：查询当前 IP
    await doLookup('');
    return;
  }
  await doLookup(input);
}

async function doLookup(input: string) {
  loading.value = true;
  error.value = '';
  result.value = null;

  try {
    let ip = input;
    let resolvedDomain: string | undefined;

    // 检测是否为域名，是则先解析
    if (input && isDomain(input)) {
      resolvedDomain = input;
      ip = await resolveDomain(input);
    }

    // ipapi.co: 免费 HTTPS，1000次/天，无需 API Key
    const url = ip
      ? `https://ipapi.co/${encodeURIComponent(ip)}/json/`
      : `https://ipapi.co/json/`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`查询失败 (HTTP ${res.status})`);

    const data = await res.json();
    if (data.error) {
      throw new Error(data.reason || '查询失败，请检查 IP 地址格式');
    }

    data.countryFlag = makeFlag(data.country_code);
    if (resolvedDomain) data.resolvedDomain = resolvedDomain;
    result.value = data as IpResult;
  } catch (e: any) {
    error.value = e.message || '查询失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

// ====== 初始化 ======
onMounted(() => {
  detectMyIp();
});
</script>

<style scoped>
:deep(.leaflet-container) {
  z-index: 1;
  background: #f0f0f0;
}
:deep(.ip-marker) {
  background: transparent !important;
  border: none !important;
}
</style>
