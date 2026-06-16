<template>
  <div class="space-y-4">
    <!-- 输入区 -->
    <div class="flex flex-wrap gap-2">
      <input
        v-model="target"
        type="text"
        placeholder="输入域名或 IP，例如: baidu.com"
        class="flex-1 min-w-[200px] rounded-md border px-3 py-2 text-sm focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
        @keyup.enter="startPing"
      />
      <select
        v-model="regionPreset"
        class="rounded-md border px-3 py-2 text-sm focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      >
        <option v-for="r in regionPresets" :key="r.value" :value="r.value">{{ r.label }}</option>
      </select>
      <select
        v-model="packets"
        class="rounded-md border px-3 py-2 text-sm focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      >
        <option :value="3">3 包</option>
        <option :value="5">5 包</option>
        <option :value="10">10 包</option>
      </select>
      <button
        @click="startPing"
        :disabled="pinging"
        class="px-5 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
        style="background-color: var(--color-primary);"
      >
        {{ pinging ? '测速中...' : '🚀 开始测速' }}
      </button>
    </div>

    <!-- 自定义地区 + 国内精确定位提示 -->
    <div v-if="regionPreset === 'custom'" class="flex gap-2">
      <input
        v-model="customLocations"
        type="text"
        placeholder="国家代码逗号分隔，如 CN,US,JP,DE"
        class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      />
    </div>
    <div v-if="regionPreset === 'china'" class="text-xs" style="color: var(--color-text-muted);">
      💡 国内节点通过 Globalping 社区探针获取，覆盖电信/联通/移动等运营商骨干网络
    </div>

    <!-- 进度 -->
    <div v-if="pinging" class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <div class="flex items-center gap-3">
        <svg class="animate-spin h-5 w-5 shrink-0" style="color: var(--color-primary);" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <div>
          <p class="text-sm font-medium" style="color: var(--color-text);">
            正在从 {{ probesCount }} 个节点测速
            <span v-if="completedProbes > 0">({{ completedProbes }}/{{ probesCount }})</span>
          </p>
          <p class="text-xs mt-0.5" style="color: var(--color-text-muted);">目标: {{ target }} · 等待探测节点返回...</p>
        </div>
      </div>
      <div class="mt-3 h-1.5 rounded-full overflow-hidden" style="background-color: var(--color-bg-tertiary);">
        <div class="h-full rounded-full transition-all duration-500"
          style="background-color: var(--color-primary);"
          :style="{ width: probesCount > 0 ? (completedProbes / probesCount * 100) + '%' : '0%' }"></div>
      </div>
    </div>

    <!-- 错误 -->
    <div v-if="error" class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm" style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- 结果区域 -->
    <div v-if="results.length > 0 && !pinging">
      <!-- 地图视图切换 -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 rounded-md border px-2 py-1" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
          <button @click="mapView = 'china'"
            class="px-2.5 py-1 rounded text-xs font-medium transition-colors"
            :style="mapView === 'china' ? 'background-color: var(--color-primary); color: #fff;' : 'color: var(--color-text-secondary);'">
            🇨🇳 中国
          </button>
          <button @click="mapView = 'world'"
            class="px-2.5 py-1 rounded text-xs font-medium transition-colors"
            :style="mapView === 'world' ? 'background-color: var(--color-primary); color: #fff;' : 'color: var(--color-text-secondary);'">
            🌍 全球
          </button>
        </div>
        <span class="text-xs" style="color: var(--color-text-muted);">
          {{ mappedPoints }} 个节点已标注
        </span>
      </div>

      <!-- 地图容器 -->
      <div class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
        <div ref="mapContainer" class="w-full" style="height: 420px;"></div>
      </div>

      <!-- 图例 -->
      <div class="flex flex-wrap items-center gap-3 text-xs">
        <span style="color: var(--color-text-muted);">延迟图例：</span>
        <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-full" style="background:#059669;"></span> &lt;50ms</span>
        <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-full" style="background:#d97706;"></span> &lt;150ms</span>
        <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-full" style="background:#ea580c;"></span> &lt;300ms</span>
        <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-full" style="background:#dc2626;"></span> ≥300ms</span>
        <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-full border" style="background:#6b7280; border-color:#4b5563;"></span> 不可达</span>
      </div>

      <!-- 摘要卡片 -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="rounded-md border p-3 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
          <p class="text-xs mb-1" style="color: var(--color-text-muted);">🚀 最快</p>
          <p class="text-lg font-bold" style="color: #059669;">{{ summary.fastest }}ms</p>
          <p class="text-xs truncate" style="color: var(--color-text-muted);">{{ summary.fastestLoc }}</p>
        </div>
        <div class="rounded-md border p-3 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
          <p class="text-xs mb-1" style="color: var(--color-text-muted);">🐢 最慢</p>
          <p class="text-lg font-bold" style="color: #dc2626;">{{ summary.slowest }}ms</p>
          <p class="text-xs truncate" style="color: var(--color-text-muted);">{{ summary.slowestLoc }}</p>
        </div>
        <div class="rounded-md border p-3 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
          <p class="text-xs mb-1" style="color: var(--color-text-muted);">📊 平均</p>
          <p class="text-lg font-bold" style="color: var(--color-primary);">{{ summary.average }}ms</p>
          <p class="text-xs" style="color: var(--color-text-muted);">全部节点均值</p>
        </div>
        <div class="rounded-md border p-3 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
          <p class="text-xs mb-1" style="color: var(--color-text-muted);">📡 在线率</p>
          <p class="text-lg font-bold" :style="{ color: summary.reachableRate >= 90 ? '#059669' : summary.reachableRate >= 70 ? '#d97706' : '#dc2626' }">
            {{ summary.reachableRate }}%
          </p>
          <p class="text-xs" style="color: var(--color-text-muted);">{{ summary.reachableCount }}/{{ results.length }} 可达</p>
        </div>
      </div>

      <!-- 结果表格 -->
      <div class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
        <table class="w-full text-sm">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-border);">
              <th class="px-3 py-2 text-left font-medium text-xs" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">#</th>
              <th class="px-3 py-2 text-left font-medium text-xs" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">探测节点</th>
              <th class="px-3 py-2 text-left font-medium text-xs hidden sm:table-cell" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">运营商</th>
              <th class="px-3 py-2 text-right font-medium text-xs" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">响应IP</th>
              <th class="px-3 py-2 text-right font-medium text-xs" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">最小</th>
              <th class="px-3 py-2 text-right font-medium text-xs" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">平均</th>
              <th class="px-3 py-2 text-right font-medium text-xs" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">最大</th>
              <th class="px-3 py-2 text-right font-medium text-xs" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">丢包</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, index) in sortedResults" :key="index"
              :style="index < sortedResults.length - 1 ? 'border-bottom: 1px solid var(--color-border);' : ''">
              <td class="px-3 py-2.5 text-xs" style="color: var(--color-text-muted);">{{ index + 1 }}</td>
              <td class="px-3 py-2.5">
                <span class="text-xs mr-1">{{ countryFlag(r.country) }}</span>
                <span class="text-xs" style="color: var(--color-text);">{{ getLocationLabel(r) }}</span>
              </td>
              <td class="px-3 py-2.5 text-xs hidden sm:table-cell" style="color: var(--color-text-muted);">{{ r.network || '-' }}</td>
              <td class="px-3 py-2.5 text-right font-mono text-xs" style="color: var(--color-text);">{{ r.resolvedAddress || '-' }}</td>
              <td class="px-3 py-2.5 text-right font-mono text-xs" :style="{ color: latencyColor(r.min) }">{{ r.min !== null ? r.min.toFixed(0) + 'ms' : '-' }}</td>
              <td class="px-3 py-2.5 text-right font-mono text-xs font-bold" :style="{ color: latencyColor(r.avg) }">{{ r.avg !== null ? r.avg.toFixed(0) + 'ms' : '-' }}</td>
              <td class="px-3 py-2.5 text-right font-mono text-xs" :style="{ color: latencyColor(r.max) }">{{ r.max !== null ? r.max.toFixed(0) + 'ms' : '-' }}</td>
              <td class="px-3 py-2.5 text-right font-mono text-xs">
                <span :style="{ color: r.loss === 0 ? '#059669' : r.loss < 25 ? '#d97706' : '#dc2626' }">{{ r.loss }}%</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-xs text-center" style="color: var(--color-text-muted);">
        数据由 <a href="https://globalping.io" target="_blank" class="underline" style="color: var(--color-primary);">Globalping API</a> 提供 ·
        {{ results.length }} 个探测节点 · {{ new Date().toLocaleString('zh-CN') }}
      </p>
    </div>

    <!-- 空结果 -->
    <div v-if="noResults && !pinging" class="text-center py-6 text-sm" style="color: var(--color-text-muted);">
      未获取到探测结果，请确认目标地址是否正确
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ====== 类型 ======
interface ProbeResult {
  country: string;
  city: string;
  network: string;
  resolvedAddress: string;
  min: number | null;
  avg: number | null;
  max: number | null;
  loss: number;
  rtts: number[];
}

// ====== 响应式状态 ======
const target = ref('');
const regionPreset = ref('world');
const packets = ref(5);
const customLocations = ref('');
const pinging = ref(false);
const error = ref('');
const noResults = ref(false);
const probesCount = ref(0);
const completedProbes = ref(0);
const results = ref<ProbeResult[]>([]);
const mapView = ref<'china' | 'world'>('world');
const mapContainer = ref<HTMLElement | null>(null);

let mapInstance: L.Map | null = null;
let markerLayer: L.LayerGroup | null = null;

// ====== 地区预设 ======
const regionPresets = [
  { value: 'world', label: '🌍 全球' },
  { value: 'china', label: '🇨🇳 中国' },
  { value: 'asia', label: '🌏 亚洲' },
  { value: 'europe', label: '🌍 欧洲' },
  { value: 'north-america', label: '🌎 北美' },
  { value: 'oceania', label: '🌏 大洋洲' },
  { value: 'south-america', label: '🌎 南美' },
  { value: 'custom', label: '✏️ 自定义' },
];

const regionCountries: Record<string, string[]> = {
  'china': ['CN', 'CN', 'CN', 'CN'],
  'asia': ['CN', 'CN', 'JP', 'JP', 'KR', 'KR', 'SG', 'IN', 'IN', 'HK', 'TW', 'VN', 'TH', 'MY', 'ID', 'PH', 'PK'],
  'europe': ['DE', 'DE', 'GB', 'GB', 'FR', 'FR', 'NL', 'NL', 'IT', 'IT', 'ES', 'ES', 'SE', 'CH', 'PL', 'AT', 'BE', 'DK', 'FI', 'NO', 'PT', 'IE', 'CZ', 'RO', 'GR'],
  'north-america': ['US', 'US', 'US', 'US', 'CA', 'CA', 'MX'],
  'oceania': ['AU', 'AU', 'AU', 'NZ'],
  'south-america': ['BR', 'BR', 'AR', 'CL', 'CO', 'PE', 'EC'],
};

function getLocations(): object[] {
  if (regionPreset.value === 'world') return [];
  if (regionPreset.value === 'custom') {
    const codes = customLocations.value.split(/[,;\s]+/).filter(Boolean).map(s => s.trim().toUpperCase());
    return codes.map(c => ({ country: c }));
  }
  const countries = regionCountries[regionPreset.value] || [];
  return countries.map(c => ({ country: c }));
}

// ====== 排序 & 统计 ======
const sortedResults = computed(() => {
  return [...results.value].sort((a, b) => {
    if (a.avg === null && b.avg === null) return 0;
    if (a.avg === null) return 1;
    if (b.avg === null) return -1;
    return a.avg - b.avg;
  });
});

const mappedPoints = computed(() => {
  return results.value.filter(r => getCoords(r)).length;
});

const summary = computed(() => {
  const valid = results.value.filter(r => r.avg !== null);
  if (valid.length === 0) {
    return { fastest: '-', fastestLoc: '', slowest: '-', slowestLoc: '', average: '-', reachableRate: 0, reachableCount: 0 };
  }
  const sorted = [...valid].sort((a, b) => (a.avg || 0) - (b.avg || 0));
  const fastest = sorted[0];
  const slowest = sorted[sorted.length - 1];
  const avg = valid.reduce((sum, r) => sum + (r.avg || 0), 0) / valid.length;
  const reachableCount = results.value.filter(r => r.avg !== null).length;
  return {
    fastest: fastest.avg?.toFixed(0) || '-',
    fastestLoc: fastest.city || fastest.country,
    slowest: slowest.avg?.toFixed(0) || '-',
    slowestLoc: slowest.city || slowest.country,
    average: avg.toFixed(0),
    reachableRate: results.value.length > 0 ? Math.round(reachableCount / results.value.length * 100) : 0,
    reachableCount,
  };
});

// ====== 工具函数 ======
function getLocationLabel(r: ProbeResult): string {
  if (r.city && r.city !== 'Unknown') return r.city;
  return countryName(r.country) || r.country;
}

function latencyColor(ms: number | null): string {
  if (ms === null) return '#6b7280';
  if (ms < 50) return '#059669';
  if (ms < 150) return '#d97706';
  if (ms < 300) return '#ea580c';
  return '#dc2626';
}

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '🌐';
  return String.fromCodePoint(0x1F1E6 + code.charCodeAt(0) - 65) +
         String.fromCodePoint(0x1F1E6 + code.charCodeAt(1) - 65);
}

function countryName(code: string): string {
  const m: Record<string, string> = {
    CN:'中国',JP:'日本',KR:'韩国',SG:'新加坡',IN:'印度',HK:'香港',TW:'台湾',VN:'越南',TH:'泰国',MY:'马来西亚',
    DE:'德国',GB:'英国',FR:'法国',NL:'荷兰',IT:'意大利',ES:'西班牙',SE:'瑞典',CH:'瑞士',PL:'波兰',
    US:'美国',CA:'加拿大',MX:'墨西哥',AU:'澳大利亚',NZ:'新西兰',
    BR:'巴西',AR:'阿根廷',CL:'智利',CO:'哥伦比亚',
  };
  return m[code] || code;
}

// ====== 城市坐标库 ======
// key: "city,countryCode" 或仅 "countryCode"，value: [lat, lng]
function getCoords(r: ProbeResult): [number, number] | null {
  const c = r.city?.trim();
  const cc = r.country?.trim().toUpperCase();
  const key = `${c},${cc}`;
  const countryOnly = `,${cc}`;

  if (cityCoords[key]) return cityCoords[key];
  if (cityCoords[countryOnly]) return cityCoords[countryOnly];
  // 模糊匹配：城市名含有关键词
  if (c) {
    for (const [k, v] of Object.entries(cityCoords)) {
      if (k.endsWith(`,${cc}`) && k.toLowerCase().includes(c.toLowerCase())) return v;
    }
  }
  return null;
}

// key: "City,CC" → [lat, lng]
const cityCoords: Record<string, [number, number]> = {
  // 中国
  'Beijing,CN': [39.9, 116.4], 'Shanghai,CN': [31.2, 121.5], 'Guangzhou,CN': [23.1, 113.3],
  'Shenzhen,CN': [22.5, 114.1], 'Chengdu,CN': [30.6, 104.1], 'Hangzhou,CN': [30.3, 120.2],
  'Nanjing,CN': [32.1, 118.8], 'Wuhan,CN': [30.6, 114.3], 'Chongqing,CN': [29.4, 106.5],
  'Tianjin,CN': [39.1, 117.2], "Xi'an,CN": [34.3, 108.9], 'Shenyang,CN': [41.8, 123.4],
  'Qingdao,CN': [36.1, 120.4], 'Dalian,CN': [38.9, 121.6], 'Xiamen,CN': [24.5, 118.1],
  'Changsha,CN': [28.2, 113.0], 'Zhengzhou,CN': [34.8, 113.7], 'Jinan,CN': [36.7, 117.0],
  'Fuzhou,CN': [26.1, 119.3], 'Hefei,CN': [31.8, 117.2], 'Kunming,CN': [25.0, 102.7],
  'Guiyang,CN': [26.6, 106.7], 'Nanning,CN': [22.8, 108.4], 'Haikou,CN': [20.0, 110.3],
  'Lanzhou,CN': [36.1, 103.8], 'Hohhot,CN': [40.8, 111.8], 'Urumqi,CN': [43.8, 87.6],
  'Lhasa,CN': [29.6, 91.1], 'Suzhou,CN': [31.3, 120.6], 'Ningbo,CN': [29.9, 121.5],
  'Shijiazhuang,CN': [38.0, 114.5], 'Taiyuan,CN': [37.9, 112.6], 'Harbin,CN': [45.8, 126.5],
  'Changchun,CN': [43.8, 125.3], 'Nanchang,CN': [28.7, 115.9],
  ',CN': [35.0, 105.0],
  // 日本
  'Tokyo,JP': [35.7, 139.7], 'Osaka,JP': [34.7, 135.5], 'Nagoya,JP': [35.2, 136.9],
  ',JP': [36.0, 138.0],
  // 韩国
  'Seoul,KR': [37.6, 127.0], 'Busan,KR': [35.2, 129.1], ',KR': [36.0, 127.5],
  // 新加坡
  'Singapore,SG': [1.35, 103.8], ',SG': [1.35, 103.8],
  // 印度
  'Mumbai,IN': [19.1, 72.9], 'Delhi,IN': [28.6, 77.2], 'Bangalore,IN': [13.0, 77.6],
  'Chennai,IN': [13.1, 80.3], 'Hyderabad,IN': [17.4, 78.5], ',IN': [20.0, 78.0],
  // 香港/台湾/越南/泰国/马来西亚
  'Hong Kong,HK': [22.3, 114.2], ',HK': [22.3, 114.2],
  'Taipei,TW': [25.0, 121.5], ',TW': [23.5, 121.0],
  'Ho Chi Minh City,VN': [10.8, 106.7], 'Hanoi,VN': [21.0, 105.8], ',VN': [14.0, 108.0],
  'Bangkok,TH': [13.8, 100.5], ',TH': [13.8, 100.5],
  'Kuala Lumpur,MY': [3.1, 101.7], ',MY': [4.0, 102.0],
  // 欧洲
  'London,GB': [51.5, -0.1], 'Manchester,GB': [53.5, -2.2], ',GB': [54.0, -2.0],
  'Berlin,DE': [52.5, 13.4], 'Frankfurt,DE': [50.1, 8.7], 'Munich,DE': [48.1, 11.6],
  'Hamburg,DE': [53.6, 10.0], 'Dusseldorf,DE': [51.2, 6.8], ',DE': [51.0, 10.0],
  'Paris,FR': [48.9, 2.3], 'Marseille,FR': [43.3, 5.4], ',FR': [47.0, 2.0],
  'Amsterdam,NL': [52.4, 4.9], 'Rotterdam,NL': [51.9, 4.5], ',NL': [52.0, 5.0],
  'Milan,IT': [45.5, 9.2], 'Rome,IT': [41.9, 12.5], ',IT': [43.0, 12.0],
  'Madrid,ES': [40.4, -3.7], 'Barcelona,ES': [41.4, 2.2], ',ES': [40.0, -3.0],
  'Stockholm,SE': [59.3, 18.1], ',SE': [60.0, 15.0],
  'Zurich,CH': [47.4, 8.5], 'Geneva,CH': [46.2, 6.1], ',CH': [47.0, 8.0],
  'Warsaw,PL': [52.2, 21.0], ',PL': [52.0, 19.0],
  'Moscow,RU': [55.8, 37.6], 'Saint Petersburg,RU': [59.9, 30.3], ',RU': [60.0, 100.0],
  'Vienna,AT': [48.2, 16.4], 'Graz,AT': [47.1, 15.4], ',AT': [47.5, 14.0],
  'Brussels,BE': [50.8, 4.4], 'Antwerp,BE': [51.2, 4.4], ',BE': [50.5, 4.5],
  'Copenhagen,DK': [55.7, 12.6], 'Aarhus,DK': [56.2, 10.2], ',DK': [56.0, 10.0],
  'Oslo,NO': [59.9, 10.8], 'Bergen,NO': [60.4, 5.3], ',NO': [62.0, 10.0],
  'Helsinki,FI': [60.2, 25.0], ',FI': [62.0, 26.0],
  'Lisbon,PT': [38.7, -9.1], 'Porto,PT': [41.2, -8.6], ',PT': [39.5, -8.0],
  'Dublin,IE': [53.3, -6.3], 'Cork,IE': [51.9, -8.5], ',IE': [53.0, -8.0],
  'Prague,CZ': [50.1, 14.4], ',CZ': [49.8, 15.5],
  'Budapest,HU': [47.5, 19.0], ',HU': [47.0, 19.5],
  'Bucharest,RO': [44.4, 26.1], ',RO': [46.0, 25.0],
  'Sofia,BG': [42.7, 23.3], ',BG': [42.7, 25.0],
  'Athens,GR': [38.0, 23.7], 'Thessaloniki,GR': [40.6, 22.9], ',GR': [39.0, 22.0],
  'Istanbul,TR': [41.0, 29.0], 'Kyiv,UA': [50.5, 30.5],
  // 东南亚/南亚（补充）
  'Jakarta,ID': [-6.2, 106.8], 'Surabaya,ID': [-7.2, 112.7], ',ID': [-5.0, 120.0],
  'Manila,PH': [14.6, 121.0], ',PH': [13.0, 122.0],
  'Karachi,PK': [24.9, 67.1], 'Islamabad,PK': [33.7, 73.0], ',PK': [30.0, 70.0],
  // 北美
  'New York,US': [40.7, -74.0], 'Los Angeles,US': [34.1, -118.2], 'Chicago,US': [41.9, -87.6],
  'Dallas,US': [32.8, -96.8], 'San Francisco,US': [37.8, -122.4], 'Seattle,US': [47.6, -122.3],
  'Miami,US': [25.8, -80.2], 'Atlanta,US': [33.7, -84.4], 'Boston,US': [42.4, -71.1],
  'Denver,US': [39.7, -105.0], 'Phoenix,US': [33.4, -112.1], 'Houston,US': [29.8, -95.4],
  'Ashburn,US': [39.0, -77.5], 'San Jose,US': [37.3, -121.9], 'Portland,US': [45.5, -122.7],
  'Las Vegas,US': [36.2, -115.1], 'Minneapolis,US': [45.0, -93.3], 'Tampa,US': [28.0, -82.5],
  'Philadelphia,US': [40.0, -75.2], 'Detroit,US': [42.3, -83.0], 'Austin,US': [30.3, -97.7],
  'Charlotte,US': [35.2, -80.8], 'Columbus,US': [40.0, -83.0], 'Indianapolis,US': [39.8, -86.1],
  'Kansas City,US': [39.1, -94.6], 'Salt Lake City,US': [40.8, -111.9], 'Raleigh,US': [35.8, -78.6],
  ',US': [39.0, -98.0],
  'Toronto,CA': [43.7, -79.4], 'Vancouver,CA': [49.3, -123.1], 'Montreal,CA': [45.5, -73.6],
  'Calgary,CA': [51.0, -114.1], ',CA': [56.0, -106.0],
  'Mexico City,MX': [19.4, -99.1], ',MX': [23.0, -102.0],
  // 南美
  'Sao Paulo,BR': [-23.5, -46.6], 'Rio de Janeiro,BR': [-22.9, -43.2], 'Brasilia,BR': [-15.8, -47.9],
  ',BR': [-10.0, -55.0],
  'Buenos Aires,AR': [-34.6, -58.4], ',AR': [-38.0, -63.0],
  'Santiago,CL': [-33.4, -70.7], ',CL': [-33.0, -70.6],
  'Bogota,CO': [4.7, -74.1], ',CO': [4.6, -74.0],
  'Lima,PE': [-12.0, -77.0], ',PE': [-10.0, -76.0],
  'Quito,EC': [-0.2, -78.5], ',EC': [-1.0, -78.0],
  // 大洋洲
  'Sydney,AU': [-33.9, 151.2], 'Melbourne,AU': [-37.8, 145.0], 'Brisbane,AU': [-27.5, 153.0],
  'Perth,AU': [-32.0, 115.9], 'Adelaide,AU': [-34.9, 138.6], ',AU': [-25.0, 135.0],
  'Auckland,NZ': [-36.8, 174.8], ',NZ': [-41.0, 174.0],
  // 中东/非洲
  'Dubai,AE': [25.2, 55.3], 'Tel Aviv,IL': [32.1, 34.8],
  'Cape Town,ZA': [-33.9, 18.4], 'Johannesburg,ZA': [-26.2, 28.0], ',ZA': [-29.0, 24.0],
  'Lagos,NG': [6.5, 3.4], 'Nairobi,KE': [-1.3, 36.8], 'Cairo,EG': [30.0, 31.2],
};

// ====== 地图 ======
const TILES_GAODE = {
  china: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
  subdomains: ['1', '2', '3', '4'],
};

const TILES_WORLD = {
  world: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  subdomains: 'abcd',
};

function initMap() {
  if (!mapContainer.value) return;
  destroyMap();

  const isChinaView = mapView.value === 'china';
  const tile = isChinaView ? TILES_GAODE : TILES_WORLD;

  mapInstance = L.map(mapContainer.value, {
    center: isChinaView ? [35, 105] : [20, 0],
    zoom: isChinaView ? 4 : 2,
    zoomControl: true,
    attributionControl: false,
  });

  L.tileLayer(tile.world || tile.china, {
    subdomains: tile.subdomains || [],
    maxZoom: 18,
    minZoom: 1,
  }).addTo(mapInstance);

  markerLayer = L.layerGroup().addTo(mapInstance);

  // 添加标记
  addMarkers();

  if (mapInstance && markerLayer) {
    try {
      const bounds = (markerLayer as L.LayerGroup).getBounds();
      if (bounds.isValid()) {
        mapInstance.fitBounds(bounds, { padding: [30, 30], maxZoom: isChinaView ? 8 : 12 });
      }
    } catch { /* ignore */ }
  }
}

function destroyMap() {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    markerLayer = null;
  }
}

function addMarkers() {
  if (!markerLayer) return;

  markerLayer.clearLayers();
  const points: Array<{ coords: [number, number]; r: ProbeResult }> = [];

  for (const r of results.value) {
    const coords = getCoords(r);
    if (coords) points.push({ coords, r });
  }

  if (points.length === 0) return;

  // 按相同坐标分组（避免重叠）
  const grouped = new Map<string, { coords: [number, number]; rs: ProbeResult[] }>();
  for (const p of points) {
    const key = `${p.coords[0].toFixed(2)},${p.coords[1].toFixed(2)}`;
    if (!grouped.has(key)) grouped.set(key, { coords: p.coords, rs: [] });
    grouped.get(key)!.rs.push(p.r);
  }

  for (const [, g] of grouped) {
    // 取该组的最快延迟作为颜色依据
    const best = g.rs.reduce((a, b) => (a.avg ?? 999) < (b.avg ?? 999) ? a : b);
    const color = latencyColor(best.avg);

    const popupLines = g.rs.map(r => {
      const loc = getLocationLabel(r);
      const net = r.network ? ` (${r.network})` : '';
      if (r.avg !== null) {
        return `<b>${loc}${net}</b><br>平均 ${r.avg.toFixed(0)}ms · 最小 ${r.min?.toFixed(0)}ms · 最大 ${r.max?.toFixed(0)}ms · 丢包 ${r.loss}%`;
      }
      return `<b>${loc}${net}</b><br>不可达 (丢包 ${r.loss}%)`;
    });

    const radius = Math.min(18, 8 + g.rs.length * 2);
    const marker = L.circleMarker(g.coords, {
      radius,
      fillColor: color,
      color: '#fff',
      weight: 1.5,
      opacity: 1,
      fillOpacity: 0.75,
    }).bindPopup(popupLines.join('<hr style="margin:4px 0">'));

    marker.addTo(markerLayer!);
  }
}

function autoDetectMapView() {
  const cnCount = results.value.filter(r => r.country === 'CN').length;
  const total = results.value.length;
  // 超过 40% 节点在中国 → 默认中国视图
  if (total > 0 && cnCount / total >= 0.4) {
    mapView.value = 'china';
  } else {
    mapView.value = 'world';
  }
}

// 当结果或地图视图变化时重建地图
watch([results, mapView], async () => {
  if (results.value.length > 0 && !pinging.value) {
    await nextTick();
    initMap();
  }
});

onBeforeUnmount(() => {
  destroyMap();
});

// ====== 测速逻辑 ======
async function startPing() {
  const trimmedTarget = target.value.trim();
  if (!trimmedTarget) {
    error.value = '请输入域名或 IP 地址';
    return;
  }

  error.value = '';
  results.value = [];
  noResults.value = false;
  pinging.value = true;
  probesCount.value = 0;
  completedProbes.value = 0;

  const locations = getLocations();
  // 无过滤 = 全球所有探针池，取 35 个；有过滤 = 取 25 个（Globalping 会尽量从匹配地区分配）
  const probeLimit = locations.length > 0 ? 25 : 35;

  try {
    const createRes = await fetch('https://api.globalping.io/v1/measurements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ping',
        target: trimmedTarget,
        locations: locations.length > 0 ? locations : [],
        limit: probeLimit,
        measurementOptions: { packets: packets.value },
      }),
    });

    if (!createRes.ok) {
      if (createRes.status === 429) throw new Error('请求过于频繁，请稍后再试（免费限额: 250次/小时）');
      const errData = await createRes.json().catch(() => ({}));
      throw new Error(errData.message || `创建测量失败 (HTTP ${createRes.status})`);
    }

    const createData = await createRes.json();
    const measurementId = createData.id;
    probesCount.value = createData.probesCount || probeLimit;

    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pollRes = await fetch(`https://api.globalping.io/v1/measurements/${measurementId}`);
      if (!pollRes.ok) throw new Error(`查询结果失败 (HTTP ${pollRes.status})`);

      const pollData = await pollRes.json();

      if (pollData.status === 'finished') {
        const parsed: ProbeResult[] = (pollData.results || []).map((r: any) => {
          const probe = r.probe || {};
          const stats = r.result?.stats || {};
          return {
            country: probe.country || 'Unknown',
            city: probe.city || 'Unknown',
            network: probe.network || '',
            resolvedAddress: r.result?.resolvedAddress || '',
            min: stats.min !== undefined ? stats.min : null,
            avg: stats.avg !== undefined ? stats.avg : null,
            max: stats.max !== undefined ? stats.max : null,
            loss: stats.loss !== undefined ? stats.loss : 0,
            rtts: stats.rtts || [],
          };
        });

        if (parsed.length === 0) { noResults.value = true; }
        else {
          results.value = parsed;
          completedProbes.value = parsed.length;
          autoDetectMapView();
        }
        return;
      }

      if (pollData.status === 'failed') throw new Error('测量失败，Globalping 无法完成探测');
      completedProbes.value = (pollData.results || []).length;
    }

    if (results.value.length === 0) throw new Error('测量超时（30秒），请重试');
  } catch (e: any) {
    error.value = e.message || '测速失败，请稍后重试';
  } finally {
    pinging.value = false;
  }
}
</script>

<style scoped>
/* 修复 Leaflet 容器 z-index，避免被页面其他层遮挡 */
:deep(.leaflet-container) {
  z-index: 1;
  background: #f5f5f5;
}
</style>
