<template>
  <div class="space-y-4">
    <TabView :tabs="['时区转换', '多时区对照', '两地时差']">
      <!-- 时区转换 -->
      <template #tab-0>
        <div class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-medium" style="color: var(--color-text-secondary);">源时区</label>
              <select v-model="srcTz" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);">
                <option v-for="z in zones" :key="z.tz" :value="z.tz">{{ z.label }}</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium" style="color: var(--color-text-secondary);">目标时区</label>
              <select v-model="targetTz" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);">
                <option v-for="z in zones" :key="z.tz" :value="z.tz">{{ z.label }}</option>
              </select>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-xs font-medium" style="color: var(--color-text-secondary);">源时间（按源时区理解）</label>
              <button @click="useNow" class="text-xs" style="color: var(--color-primary);">使用当前时刻</button>
            </div>
            <input v-model="srcInput" type="datetime-local" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);" />
          </div>

          <ErrorAlert :message="error" />

          <div v-if="convertResult" class="rounded-md border p-4 space-y-2" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <div class="flex justify-between items-center text-sm">
              <span style="color: var(--color-text-secondary);">源时间（{{ srcTz }}）</span>
              <span style="color: var(--color-text);">{{ convertResult.src }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span style="color: var(--color-text-secondary);">目标时间（{{ targetTz }}）</span>
              <span class="font-medium" style="color: var(--color-primary);">{{ convertResult.target }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span style="color: var(--color-text-secondary);">目标时区偏移</span>
              <span style="color: var(--color-text);">{{ convertResult.targetOffset }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span style="color: var(--color-text-secondary);">UTC 时间</span>
              <span style="color: var(--color-text);">{{ convertResult.utc }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 多时区对照 -->
      <template #tab-1>
        <div class="space-y-3">
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-xs font-medium" style="color: var(--color-text-secondary);">基准时间（按 UTC 理解）</label>
              <button @click="useNowMulti" class="text-xs" style="color: var(--color-primary);">使用当前时刻</button>
            </div>
            <input v-model="multiInput" type="datetime-local" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);" />
          </div>
          <ErrorAlert :message="error" />
          <div v-if="multiRows.length" class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
            <table class="w-full text-sm" style="border-collapse: collapse;">
              <thead>
                <tr style="background-color: var(--color-bg-secondary);">
                  <th class="text-left py-2 px-3 font-medium" style="color: var(--color-text-secondary);">时区</th>
                  <th class="text-left py-2 px-3 font-medium" style="color: var(--color-text-secondary);">本地时间</th>
                  <th class="text-right py-2 px-3 font-medium" style="color: var(--color-text-secondary);">偏移</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in multiRows" :key="r.tz" class="border-t" style="border-color: var(--color-border);">
                  <td class="py-2 px-3" style="color: var(--color-text);">{{ r.label }}</td>
                  <td class="py-2 px-3 font-mono" style="color: var(--color-primary);">{{ r.time }}</td>
                  <td class="py-2 px-3 text-right" style="color: var(--color-text-muted);">{{ r.offset }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- 两地时差 -->
      <template #tab-2>
        <div class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-medium" style="color: var(--color-text-secondary);">时区 A</label>
              <select v-model="diffTzA" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);">
                <option v-for="z in zones" :key="z.tz" :value="z.tz">{{ z.label }}</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium" style="color: var(--color-text-secondary);">时区 B</label>
              <select v-model="diffTzB" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);">
                <option v-for="z in zones" :key="z.tz" :value="z.tz">{{ z.label }}</option>
              </select>
            </div>
          </div>
          <div v-if="tzDiff" class="rounded-md border p-4 space-y-2" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <div class="text-center text-lg font-medium" style="color: var(--color-primary);">{{ tzDiff.text }}</div>
            <p class="text-xs text-center" style="color: var(--color-text-muted);">A 偏移 {{ tzDiff.offA }} · B 偏移 {{ tzDiff.offB }}（按当前时刻的夏令时计算）</p>
          </div>
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import TabView from '../../common/TabView.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

interface Zone { tz: string; label: string; }

const COMMON_ZONES: Zone[] = [
  { tz: 'UTC', label: 'UTC（协调世界时）' },
  { tz: 'Asia/Shanghai', label: '北京 / 上海' },
  { tz: 'Asia/Hong_Kong', label: '香港' },
  { tz: 'Asia/Taipei', label: '台北' },
  { tz: 'Asia/Tokyo', label: '东京' },
  { tz: 'Asia/Seoul', label: '首尔' },
  { tz: 'Asia/Singapore', label: '新加坡' },
  { tz: 'Asia/Kuala_Lumpur', label: '吉隆坡' },
  { tz: 'Asia/Bangkok', label: '曼谷' },
  { tz: 'Asia/Jakarta', label: '雅加达' },
  { tz: 'Asia/Manila', label: '马尼拉' },
  { tz: 'Asia/Kolkata', label: '新德里' },
  { tz: 'Asia/Karachi', label: '卡拉奇' },
  { tz: 'Asia/Dubai', label: '迪拜' },
  { tz: 'Asia/Tehran', label: '德黑兰' },
  { tz: 'Europe/Moscow', label: '莫斯科' },
  { tz: 'Europe/Istanbul', label: '伊斯坦布尔' },
  { tz: 'Europe/Athens', label: '雅典' },
  { tz: 'Europe/Paris', label: '巴黎' },
  { tz: 'Europe/Berlin', label: '柏林' },
  { tz: 'Europe/Madrid', label: '马德里' },
  { tz: 'Europe/London', label: '伦敦' },
  { tz: 'Africa/Cairo', label: '开罗' },
  { tz: 'Africa/Johannesburg', label: '约翰内斯堡' },
  { tz: 'America/Sao_Paulo', label: '圣保罗' },
  { tz: 'America/Argentina/Buenos_Aires', label: '布宜诺斯艾利斯' },
  { tz: 'America/New_York', label: '纽约' },
  { tz: 'America/Chicago', label: '芝加哥' },
  { tz: 'America/Denver', label: '丹佛' },
  { tz: 'America/Los_Angeles', label: '洛杉矶' },
  { tz: 'America/Mexico_City', label: '墨西哥城' },
  { tz: 'Pacific/Honolulu', label: '檀香山' },
  { tz: 'Australia/Perth', label: '珀斯' },
  { tz: 'Australia/Sydney', label: '悉尼' },
  { tz: 'Pacific/Auckland', label: '奥克兰' },
];

const pad = (n: number) => String(n).padStart(2, '0');

function localZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function buildZones(): Zone[] {
  const local = localZone();
  const list: Zone[] = [];
  if (!COMMON_ZONES.some((z) => z.tz === local)) {
    list.push({ tz: local, label: `${local}（本机时区）` });
  }
  return list.concat(COMMON_ZONES);
}

const zones = buildZones();

// 某时区在给定时刻相对 UTC 的偏移（分钟），正数表示比 UTC 早
function tzOffsetMinutes(tz: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const m: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== 'literal') m[p.type] = p.value;
  }
  let hour = parseInt(m.hour, 10);
  if (hour === 24) hour = 0;
  const asUTC = Date.UTC(+m.year, +m.month - 1, +m.day, hour, +m.minute, +m.second);
  return Math.round((asUTC - date.getTime()) / 60000);
}

function offsetLabel(min: number): string {
  const sign = min >= 0 ? '+' : '-';
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const mm = abs % 60;
  return `UTC${sign}${h}${mm ? ':' + pad(mm) : ''}`;
}

function parseLocal(s: string): { y: number; mo: number; d: number; h: number; mi: number; se: number } | null {
  if (!s) return null;
  const [datePart, timePart = '00:00'] = s.split('T');
  const dp = datePart.split('-').map(Number);
  const tp = timePart.split(':').map(Number);
  if (dp.length < 3 || dp.some(isNaN)) return null;
  return { y: dp[0], mo: dp[1], d: dp[2], h: tp[0] || 0, mi: tp[1] || 0, se: tp[2] || 0 };
}

function fmtInTz(tz: string, epoch: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(epoch));
}

function toLocalInput(d: Date): string {
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
}

function toUtcInput(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

const srcTz = ref(localZone());
const targetTz = ref('America/New_York');
const srcInput = ref('');
const error = ref('');

const convertResult = computed(() => {
  error.value = '';
  const p = parseLocal(srcInput.value);
  if (!p) {
    error.value = '请填写有效的日期时间';
    return null;
  }
  try {
    const wallMs = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.se);
    const srcOff = tzOffsetMinutes(srcTz.value, new Date(wallMs));
    const utcEpoch = wallMs - srcOff * 60000;
    const targetOff = tzOffsetMinutes(targetTz.value, new Date(utcEpoch));
    return {
      src: fmtInTz(srcTz.value, utcEpoch),
      target: fmtInTz(targetTz.value, utcEpoch),
      targetOffset: offsetLabel(targetOff),
      utc: fmtInTz('UTC', utcEpoch),
    };
  } catch {
    error.value = '转换失败';
    return null;
  }
});

const multiInput = ref('');
const multiRows = computed(() => {
  const p = parseLocal(multiInput.value);
  if (!p) return [];
  const epoch = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.se);
  return zones.map((z) => {
    const off = tzOffsetMinutes(z.tz, new Date(epoch));
    return { tz: z.tz, label: z.label, time: fmtInTz(z.tz, epoch), offset: offsetLabel(off) };
  });
});

const diffTzA = ref(localZone());
const diffTzB = ref('America/New_York');
const tzDiff = computed(() => {
  const now = Date.now();
  const offA = tzOffsetMinutes(diffTzA.value, new Date(now));
  const offB = tzOffsetMinutes(diffTzB.value, new Date(now));
  const diff = offB - offA;
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 60);
  const mm = abs % 60;
  const text = diff === 0 ? '两地无时差' : `B 比 A ${diff > 0 ? '快' : '慢'} ${h} 小时${mm ? ' ' + mm + ' 分' : ''}`;
  return { text, offA: offsetLabel(offA), offB: offsetLabel(offB) };
});

function useNow() {
  srcTz.value = localZone();
  srcInput.value = toLocalInput(new Date());
}
function useNowMulti() {
  multiInput.value = toUtcInput(new Date());
}

onMounted(() => {
  const now = new Date();
  srcInput.value = toLocalInput(now);
  multiInput.value = toUtcInput(now);
});
</script>
