<template>
  <div class="space-y-4">
    <!-- 输入区 -->
    <div class="flex flex-wrap gap-2">
      <input
        v-model="target"
        type="text"
        placeholder="输入域名或 IP，例如: example.com"
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
        <option :value="3">3 个包</option>
        <option :value="5">5 个包</option>
        <option :value="10">10 个包</option>
      </select>
      <button
        @click="startPing"
        :disabled="pinging"
        class="px-5 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
        style="background-color: var(--color-primary);"
      >
        {{ pinging ? '测速中...' : '开始测速' }}
      </button>
    </div>

    <!-- 自定义地区输入 -->
    <div v-if="regionPreset === 'custom'" class="flex gap-2">
      <input
        v-model="customLocations"
        type="text"
        placeholder="输入国家代码，逗号分隔，如: CN,US,JP,DE,GB"
        class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      />
      <span class="text-xs self-center whitespace-nowrap" style="color: var(--color-text-muted);">
        ISO 3166 国家代码
      </span>
    </div>

    <!-- 进度提示 -->
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
          <p class="text-xs mt-0.5" style="color: var(--color-text-muted);">
            目标: {{ target }} · 等待全球探测节点返回结果...
          </p>
        </div>
      </div>
      <!-- 进度条 -->
      <div class="mt-3 h-1.5 rounded-full overflow-hidden" style="background-color: var(--color-bg-tertiary);">
        <div
          class="h-full rounded-full transition-all duration-500"
          style="background-color: var(--color-primary);"
          :style="{ width: probesCount > 0 ? (completedProbes / probesCount * 100) + '%' : '0%' }"
        ></div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm" style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- 结果区域 -->
    <div v-if="results.length > 0 && !pinging">
      <!-- 摘要卡片 -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="rounded-md border p-3 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
          <p class="text-xs mb-1" style="color: var(--color-text-muted);">🚀 最快节点</p>
          <p class="text-lg font-bold" style="color: #059669;">{{ summary.fastest }}ms</p>
          <p class="text-xs truncate" style="color: var(--color-text-muted);">{{ summary.fastestLoc }}</p>
        </div>
        <div class="rounded-md border p-3 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
          <p class="text-xs mb-1" style="color: var(--color-text-muted);">🐢 最慢节点</p>
          <p class="text-lg font-bold" style="color: #dc2626;">{{ summary.slowest }}ms</p>
          <p class="text-xs truncate" style="color: var(--color-text-muted);">{{ summary.slowestLoc }}</p>
        </div>
        <div class="rounded-md border p-3 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
          <p class="text-xs mb-1" style="color: var(--color-text-muted);">📊 平均延迟</p>
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
              <th class="px-4 py-2 text-left font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">#</th>
              <th class="px-4 py-2 text-left font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">位置</th>
              <th class="px-4 py-2 text-left font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">运营商</th>
              <th class="px-4 py-2 text-right font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">IP</th>
              <th class="px-4 py-2 text-right font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">最小</th>
              <th class="px-4 py-2 text-right font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">平均</th>
              <th class="px-4 py-2 text-right font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">最大</th>
              <th class="px-4 py-2 text-right font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">丢包</th>
              <th class="px-4 py-2 text-center font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">延迟图</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(r, index) in sortedResults"
              :key="index"
              :style="index < sortedResults.length - 1 ? 'border-bottom: 1px solid var(--color-border);' : ''"
            >
              <td class="px-4 py-2.5" style="color: var(--color-text-muted);">{{ index + 1 }}</td>
              <td class="px-4 py-2.5">
                <span class="text-xs mr-1.5">{{ countryFlag(r.country) }}</span>
                <span style="color: var(--color-text);">{{ getLocationLabel(r) }}</span>
              </td>
              <td class="px-4 py-2.5 text-xs" style="color: var(--color-text-muted);">{{ r.network || '-' }}</td>
              <td class="px-4 py-2.5 text-xs font-mono text-right" style="color: var(--color-text);">
                <span>{{ r.resolvedAddress || '-' }}</span>
              </td>
              <td class="px-4 py-2.5 text-right font-mono" :style="{ color: latencyColor(r.min) }">{{ r.min !== null ? r.min.toFixed(1) + 'ms' : '-' }}</td>
              <td class="px-4 py-2.5 text-right font-mono font-bold" :style="{ color: latencyColor(r.avg) }">{{ r.avg !== null ? r.avg.toFixed(1) + 'ms' : '-' }}</td>
              <td class="px-4 py-2.5 text-right font-mono" :style="{ color: latencyColor(r.max) }">{{ r.max !== null ? r.max.toFixed(1) + 'ms' : '-' }}</td>
              <td class="px-4 py-2.5 text-right font-mono">
                <span :style="{ color: r.loss === 0 ? '#059669' : r.loss < 20 ? '#d97706' : '#dc2626' }">{{ r.loss }}%</span>
              </td>
              <td class="px-4 py-2.5">
                <div class="flex items-center justify-center" v-if="r.avg !== null">
                  <div class="h-1.5 rounded-full w-16" style="background-color: var(--color-bg-tertiary);">
                    <div
                      class="h-full rounded-full"
                      :style="{ width: latencyBarWidth(r.avg), backgroundColor: latencyColor(r.avg) }"
                    ></div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 底部信息 -->
      <p class="text-xs text-center" style="color: var(--color-text-muted);">
        数据由 Globalping API 提供，
        {{ results.length }} 个探测节点 ·
        {{ new Date().toLocaleString('zh-CN') }}
      </p>
    </div>

    <!-- 空结果 -->
    <div v-if="noResults && !pinging" class="text-center py-6 text-sm" style="color: var(--color-text-muted);">
      未获取到探测结果，请确认目标地址是否正确
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

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

const regionPresets = [
  { value: 'world', label: '🌍 全球' },
  { value: 'asia', label: '🌏 亚洲' },
  { value: 'europe', label: '🌍 欧洲' },
  { value: 'north-america', label: '🌎 北美' },
  { value: 'oceania', label: '🌏 大洋洲' },
  { value: 'south-america', label: '🌎 南美' },
  { value: 'custom', label: '✏️ 自定义' },
];

const regionCountries: Record<string, string[]> = {
  'asia': ['CN', 'JP', 'KR', 'SG', 'IN', 'HK', 'TW', 'VN'],
  'europe': ['DE', 'GB', 'FR', 'NL', 'IT', 'ES', 'SE', 'CH'],
  'north-america': ['US', 'CA', 'MX'],
  'oceania': ['AU', 'NZ'],
  'south-america': ['BR', 'AR', 'CL', 'CO'],
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

const sortedResults = computed(() => {
  return [...results.value].sort((a, b) => {
    if (a.avg === null && b.avg === null) return 0;
    if (a.avg === null) return 1;
    if (b.avg === null) return -1;
    return a.avg - b.avg;
  });
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
    fastest: fastest.avg?.toFixed(1) || '-',
    fastestLoc: fastest.city || fastest.country,
    slowest: slowest.avg?.toFixed(1) || '-',
    slowestLoc: slowest.city || slowest.country,
    average: avg.toFixed(0),
    reachableRate: results.value.length > 0 ? Math.round(reachableCount / results.value.length * 100) : 0,
    reachableCount,
  };
});

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

function latencyBarWidth(ms: number | null): string {
  if (ms === null) return '0%';
  // 取对数比例，使 0-500ms 范围合理分布
  const max = 500;
  return Math.min(100, (ms / max) * 100) + '%';
}

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '🌐';
  const a = String.fromCodePoint(0x1F1E6 + code.charCodeAt(0) - 65);
  const b = String.fromCodePoint(0x1F1E6 + code.charCodeAt(1) - 65);
  return a + b;
}

function countryName(code: string): string {
  const map: Record<string, string> = {
    CN: '中国', JP: '日本', KR: '韩国', SG: '新加坡', IN: '印度', HK: '香港', TW: '台湾', VN: '越南',
    DE: '德国', GB: '英国', FR: '法国', NL: '荷兰', IT: '意大利', ES: '西班牙', SE: '瑞典', CH: '瑞士',
    US: '美国', CA: '加拿大', MX: '墨西哥',
    AU: '澳大利亚', NZ: '新西兰',
    BR: '巴西', AR: '阿根廷', CL: '智利', CO: '哥伦比亚',
  };
  return map[code] || code;
}

async function startPing() {
  const trimmedTarget = target.value.trim();
  if (!trimmedTarget) {
    error.value = '请输入域名或 IP 地址';
    return;
  }

  // 清理旧结果
  error.value = '';
  results.value = [];
  noResults.value = false;
  pinging.value = true;
  probesCount.value = 0;
  completedProbes.value = 0;

  const locations = getLocations();
  const probeLimit = locations.length > 0 ? Math.min(locations.length, 12) : 12;

  try {
    // Step 1: 创建测量任务
    const createRes = await fetch('https://api.globalping.io/v1/measurements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ping',
        target: trimmedTarget,
        locations: locations.length > 0 ? locations : [{ magic: 'world' }],
        limit: probeLimit,
        measurementOptions: {
          packets: packets.value,
        },
      }),
    });

    if (!createRes.ok) {
      if (createRes.status === 429) {
        throw new Error('请求过于频繁，请稍后再试（免费限额: 250次/小时）');
      }
      const errData = await createRes.json().catch(() => ({}));
      throw new Error(errData.message || `创建测量任务失败 (HTTP ${createRes.status})`);
    }

    const createData = await createRes.json();
    const measurementId = createData.id;
    probesCount.value = createData.probesCount || probeLimit;

    // Step 2: 轮询获取结果（最多等 30 秒）
    const maxAttempts = 30;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pollRes = await fetch(`https://api.globalping.io/v1/measurements/${measurementId}`);
      if (!pollRes.ok) {
        throw new Error(`查询测量结果失败 (HTTP ${pollRes.status})`);
      }

      const pollData = await pollRes.json();

      if (pollData.status === 'finished') {
        // 解析结果
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

        if (parsed.length === 0) {
          noResults.value = true;
        } else {
          results.value = parsed;
          completedProbes.value = parsed.length;
        }
        return;
      }

      if (pollData.status === 'failed') {
        throw new Error('测量任务失败，Globalping 无法完成探测');
      }

      // 更新进度
      const partialResults = pollData.results || [];
      completedProbes.value = partialResults.length;
    }

    // 超时
    if (results.value.length === 0) {
      throw new Error('测量超时（30秒），部分节点未返回结果，请重试');
    }
  } catch (e: any) {
    error.value = e.message || '测速失败，请稍后重试';
  } finally {
    pinging.value = false;
  }
}
</script>
