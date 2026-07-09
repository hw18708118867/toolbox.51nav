<template>
  <div class="space-y-4">
    <TabView :tabs="['解析 Cron 表达式', '可视化生成', '最近执行时间']">
      <!-- 解析 -->
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="cronInput" label="Cron 表达式" placeholder="例如：*/5 * * * *  或  0 9 * * 1-5  或  0 */2 * * *" :rows="2" />
          <p class="text-xs" style="color: var(--color-text-muted);">
            标准格式为 5 段：分 时 日 月 周；Quartz/Spring 为 6 段（首段为秒）。字段可用 <code style="color: var(--color-primary);">*</code>、<code style="color: var(--color-primary);">,</code>、<code style="color: var(--color-primary);">-</code>、<code style="color: var(--color-primary);">/</code> 以及月份/星期英文缩写。
          </p>
          <ErrorAlert :message="error" />

          <div v-if="result.ok" class="space-y-4">
            <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
              <p class="text-xs mb-1" style="color: var(--color-text-secondary);">中文描述</p>
              <p class="text-base font-medium" style="color: var(--color-text);">{{ result.description }}</p>
            </div>

            <div class="rounded-md border p-4 space-y-1" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
              <p class="text-xs mb-2" style="color: var(--color-text-secondary);">字段拆解</p>
              <table class="w-full text-sm" style="border-collapse: collapse;">
                <tbody>
                  <tr v-for="f in fieldBreakdown" :key="f.label">
                    <td class="py-0.5 pr-3 whitespace-nowrap align-top" style="color: var(--color-text-muted); width: 1px;">{{ f.label }}</td>
                    <td class="py-0.5 align-top break-all" style="color: var(--color-primary);"><code>{{ f.value }}</code></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="rounded-md border p-4 space-y-2" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
              <p class="text-xs mb-1" style="color: var(--color-text-secondary);">未来 10 次执行时间（本地时区）</p>
              <ul class="text-sm space-y-1" style="color: var(--color-text);">
                <li v-for="(r, i) in result.nextRuns" :key="i" class="flex items-center justify-between">
                  <span>{{ formatTime(r) }}</span>
                  <span class="text-xs" style="color: var(--color-text-muted);">{{ weekday(r) }}</span>
                </li>
              </ul>
              <p v-if="result.nextRuns.length === 0" class="text-sm" style="color: var(--color-text-muted);">未来 10 年内未找到匹配时间，请检查表达式是否合法（例如 2 月 30 日）。</p>
            </div>
          </div>
        </div>
      </template>

      <!-- 可视化生成 -->
      <template #tab-1>
        <div class="space-y-3">
          <label class="flex items-center gap-2 text-sm" style="color: var(--color-text-secondary);">
            <input type="checkbox" v-model="builder.secondsEnabled" class="rounded" />
            包含秒字段（Quartz / Spring 风格，共 6 段）
          </label>

          <div v-if="builder.secondsEnabled" class="flex items-center gap-3">
            <span class="w-12 text-sm" style="color: var(--color-text);">秒</span>
            <select v-model="builder.seconds.mode" class="flex-1 rounded-md border px-2 py-1.5 text-sm" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);">
              <option value="every">每秒（0）</option>
              <option value="interval">每隔 N 秒</option>
              <option value="specific">指定秒</option>
            </select>
            <input v-if="builder.seconds.mode === 'interval'" v-model.number="builder.seconds.step" type="number" min="1" max="59" class="w-20 rounded-md border px-2 py-1.5 text-sm" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);" />
            <input v-if="builder.seconds.mode === 'specific'" v-model="builder.seconds.specific" placeholder="0,30" class="w-24 rounded-md border px-2 py-1.5 text-sm" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);" />
          </div>

          <div v-for="f in fieldRows" :key="f.key" class="flex items-center gap-3">
            <span class="w-12 text-sm" style="color: var(--color-text);">{{ f.label }}</span>
            <select v-model="builder[f.key].mode" class="flex-1 rounded-md border px-2 py-1.5 text-sm" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);">
              <option value="every">每{{ f.unit }}</option>
              <option value="interval">每隔 N {{ f.unit }}</option>
              <option value="specific">指定值</option>
            </select>
            <input v-if="builder[f.key].mode === 'interval'" v-model.number="builder[f.key].step" type="number" :min="1" :max="f.max" class="w-20 rounded-md border px-2 py-1.5 text-sm" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);" />
            <input v-if="builder[f.key].mode === 'specific'" v-model="builder[f.key].specific" :placeholder="f.hint" class="w-28 rounded-md border px-2 py-1.5 text-sm" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);" />
          </div>

          <div class="rounded-md border p-4 space-y-2" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <p class="text-xs" style="color: var(--color-text-secondary);">生成的表达式</p>
            <div class="flex items-center gap-2">
              <code class="flex-1 break-all" style="color: var(--color-primary);">{{ generatedExpr }}</code>
              <CopyButton :text="generatedExpr" />
            </div>
            <p class="text-xs" style="color: var(--color-text-muted);">{{ generatedDesc }}</p>
          </div>
        </div>
      </template>

      <!-- 最近执行时间 -->
      <template #tab-2>
        <div class="space-y-3">
          <div class="space-y-2">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">从指定时间开始推算（留空则用当前时间）</label>
            <input v-model="startTime" type="datetime-local" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);" />
          </div>
          <ErrorAlert :message="error" />
          <div v-if="result.ok" class="rounded-md border p-4 space-y-2" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <p class="text-xs mb-1" style="color: var(--color-text-secondary);">未来 20 次执行时间</p>
            <ul class="text-sm space-y-1" style="color: var(--color-text);">
              <li v-for="(r, i) in customRuns" :key="i" class="flex items-center justify-between">
                <span>{{ formatTime(r) }}</span>
                <span class="text-xs" style="color: var(--color-text-muted);">{{ weekday(r) }}</span>
              </li>
            </ul>
            <p v-if="customRuns.length === 0" class="text-sm" style="color: var(--color-text-muted);">未来 10 年内未找到匹配时间，请检查表达式。</p>
          </div>
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TabView from '../../common/TabView.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';
import CopyButton from '../../common/CopyButton.vue';

interface FieldResult {
  set: Set<number>;
  all: boolean;
  step: number | null;
}

const MONTH_NAMES: Record<string, number> = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
const DOW_NAMES: Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
const DOW_CN = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const DOW_CN_SHORT = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const pad = (n: number) => String(n).padStart(2, '0');

function resolveToken(tok: string, min: number, max: number, names?: Record<string, number>): number {
  const up = tok.toUpperCase();
  let val: number;
  if (names && names[up] !== undefined) val = names[up];
  else val = parseInt(tok, 10);
  if (isNaN(val)) throw new Error(`非法字段值：${tok}`);
  if (val === 7 && names === DOW_NAMES) val = 0;
  if (val < min || val > max) throw new Error(`字段值超出范围：${tok}（${min}-${max}）`);
  return val;
}

function parseField(field: string, min: number, max: number, names?: Record<string, number>): FieldResult {
  const set = new Set<number>();
  let all = false;
  let step: number | null = null;
  const tokens = field.split(',').map((s) => s.trim()).filter(Boolean);
  if (tokens.length === 0) throw new Error('字段不能为空');
  for (const tok of tokens) {
    let stepPart = 1;
    let base = tok;
    if (tok.includes('/')) {
      const [l, r] = tok.split('/');
      base = l;
      stepPart = parseInt(r, 10);
      if (isNaN(stepPart) || stepPart < 1) throw new Error(`非法步长：${tok}`);
    }
    if (base === '*' || base === '?') {
      for (let i = min; i <= max; i += stepPart) set.add(i);
      if (stepPart === 1) { all = true; step = null; }
      else step = stepPart;
      continue;
    }
    let lo: number, hi: number;
    if (base.includes('-')) {
      const [a, b] = base.split('-');
      lo = resolveToken(a, min, max, names);
      hi = resolveToken(b, min, max, names);
      if (hi < lo) throw new Error(`范围顺序错误：${tok}`);
    } else {
      lo = resolveToken(base, min, max, names);
      hi = lo;
    }
    for (let i = lo; i <= hi; i += stepPart) set.add(i);
  }
  return { set, all, step };
}

interface ParsedCron {
  seconds: FieldResult;
  minutes: FieldResult;
  hours: FieldResult;
  dom: FieldResult;
  month: FieldResult;
  dow: FieldResult;
  withSeconds: boolean;
}

function parseCron(expr: string): ParsedCron {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5 && parts.length !== 6) {
    throw new Error('Cron 表达式应为 5 段（分 时 日 月 周）或 6 段（秒 分 时 日 月 周）');
  }
  if (parts.length === 6) {
    return {
      seconds: parseField(parts[0], 0, 59),
      minutes: parseField(parts[1], 0, 59),
      hours: parseField(parts[2], 0, 23),
      dom: parseField(parts[3], 1, 31),
      month: parseField(parts[4], 1, 12, MONTH_NAMES),
      dow: parseField(parts[5], 0, 7, DOW_NAMES),
      withSeconds: true,
    };
  }
  return {
    seconds: { set: new Set([0]), all: false, step: null },
    minutes: parseField(parts[0], 0, 59),
    hours: parseField(parts[1], 0, 23),
    dom: parseField(parts[2], 1, 31),
    month: parseField(parts[3], 1, 12, MONTH_NAMES),
    dow: parseField(parts[4], 0, 7, DOW_NAMES),
    withSeconds: false,
  };
}

function dayMatches(date: Date, dom: FieldResult, dow: FieldResult): boolean {
  const domStar = dom.all;
  const dowStar = dow.all;
  const domOk = domStar || dom.set.has(date.getDate());
  const dowOk = dowStar || dow.set.has(date.getDay());
  if (domStar && dowStar) return true;
  if (domStar) return dowOk;
  if (dowStar) return domOk;
  return domOk || dowOk;
}

function nextRun(from: Date, p: ParsedCron): Date | null {
  const d = new Date(from.getTime() + 1000);
  d.setMilliseconds(0);
  for (let guard = 0; guard < 4000; guard++) {
    if (!p.month.set.has(d.getMonth() + 1)) {
      d.setMonth(d.getMonth() + 1, 1);
      d.setHours(0, 0, 0, 0);
      continue;
    }
    if (!dayMatches(d, p.dom, p.dow)) {
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
      continue;
    }
    const startH = d.getHours();
    for (let h = startH; h < 24; h++) {
      if (!p.hours.set.has(h)) continue;
      const startM = h === startH ? d.getMinutes() : 0;
      for (let m = startM; m < 60; m++) {
        if (!p.minutes.set.has(m)) continue;
        const startS = h === startH && m === startM ? d.getSeconds() : 0;
        for (let s = startS; s < 60; s++) {
          if (!p.seconds.set.has(s)) continue;
          return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, s, 0);
        }
      }
    }
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
  }
  return null;
}

function fieldDesc(set: Set<number>, all: boolean, step: number | null, unit: string, names?: Record<number, string>): string {
  if (all) return `每${unit}`;
  if (step) return `每隔${step}${unit}`;
  const vals = [...set].sort((a, b) => a - b);
  if (names) return vals.map((v) => names[v] ?? String(v)).join('、');
  if (vals.length === 1) return `${vals[0]}${unit}`;
  return vals.join('、') + unit;
}

function describeCron(p: ParsedCron): string {
  // ── 精确时间点（如 09:00、09:00:30）─
  const timePhrase = (() => {
    if (p.hours.set.size === 1 && p.minutes.set.size === 1) {
      const h = [...p.hours.set][0];
      const m = [...p.minutes.set][0];
      if (p.withSeconds && p.seconds.set.size === 1) {
        const s = [...p.seconds.set][0];
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
      }
      if (!p.withSeconds) return `${pad(h)}:${pad(m)}`;
    }
    return null;
  })();

  // ── 时间频率（每隔N分/时）─
  const freqParts: string[] = [];
  if (!timePhrase) {
    if (p.hours.step) freqParts.push(`每隔 ${p.hours.step} 小时`);
    else if (!p.hours.all) freqParts.push(fieldDesc(p.hours.set, p.hours.all, p.hours.step, '时'));
    if (p.minutes.step) freqParts.push(`每隔 ${p.minutes.step} 分钟`);
    else if (!p.minutes.all) freqParts.push(fieldDesc(p.minutes.set, p.minutes.all, p.minutes.step, '分'));
    if (p.withSeconds) {
      if (p.seconds.step) freqParts.push(`每隔 ${p.seconds.step} 秒`);
      else if (!p.seconds.all) freqParts.push(fieldDesc(p.seconds.set, p.seconds.all, p.seconds.step, '秒'));
    }
  }

  // ── 日期部分 ─
  let dayPart = '';
  const domStar = p.dom.all;
  const dowStar = p.dow.all;
  if (domStar && dowStar) {
    dayPart = '';   // 每天，不赘述
  } else if (domStar) {
    dayPart = [...p.dow.set].sort((a, b) => a - b).map((d) => DOW_CN[d]).join('、');
  } else if (dowStar) {
    dayPart = '每月第 ' + [...p.dom.set].sort((a, b) => a - b).join('、') + ' 日';
  } else {
    dayPart = '每月第 ' + [...p.dom.set].sort((a, b) => a - b).join('、') + ' 日，或 ' + [...p.dow.set].sort((a, b) => a - b).map((d) => DOW_CN[d]).join('、');
  }

  // ── 月份部分（仅非每月时展示）─
  const monthPart = p.month.all ? '' : [...p.month.set].sort((a, b) => a - b).map((m) => `${m}月`).join('、');

  // ── 组装 ─
  const parts: string[] = [];
  if (monthPart) parts.push(monthPart);
  if (dayPart) parts.push(dayPart);
  if (freqParts.length > 0) parts.push(freqParts.join('，'));
  else if (timePhrase) parts.push(timePhrase);

  if (parts.length === 0) return '每分钟执行';

  const prefix = p.withSeconds && p.seconds.step && freqParts.length === 1 ? '' : '';
  return prefix + parts.join(' 的 ') + ' 执行';
}

// ── 状态 ──
const cronInput = ref('*/5 * * * *');
const startTime = ref('');

interface Result {
  ok: boolean;
  error: string;
  description: string;
  nextRuns: Date[];
  parsed: ParsedCron | null;
}

const result = computed<Result>(() => {
  const expr = cronInput.value.trim();
  if (!expr) return { ok: false, error: '', description: '', nextRuns: [], parsed: null };
  try {
    const p = parseCron(expr);
    const description = describeCron(p);
    const runs: Date[] = [];
    let cur = new Date();
    for (let i = 0; i < 10; i++) {
      const n = nextRun(cur, p);
      if (!n) break;
      runs.push(n);
      cur = n;
    }
    return { ok: true, error: '', description, nextRuns: runs, parsed: p };
  } catch (e: any) {
    return { ok: false, error: e?.message || '解析失败', description: '', nextRuns: [], parsed: null };
  }
});

const error = computed(() => (result.value.ok ? '' : result.value.error));

const fieldBreakdown = computed(() => {
  if (!result.value.parsed) return [];
  const p = result.value.parsed;
  const rows = [
    { label: '秒', value: p.withSeconds ? [...p.seconds.set].sort((a, b) => a - b).join(',') : '0' },
    { label: '分', value: [...p.minutes.set].sort((a, b) => a - b).join(',') },
    { label: '时', value: [...p.hours.set].sort((a, b) => a - b).join(',') },
    { label: '日', value: p.dom.all ? '*' : [...p.dom.set].sort((a, b) => a - b).join(',') },
    { label: '月', value: p.month.all ? '*' : [...p.month.set].sort((a, b) => a - b).join(',') },
    { label: '周', value: p.dow.all ? '*' : [...p.dow.set].sort((a, b) => a - b).join(',') },
  ];
  return rows;
});

const customRuns = computed<Date[]>(() => {
  if (!result.value.ok || !result.value.parsed) return [];
  const base = startTime.value ? new Date(startTime.value) : new Date();
  if (isNaN(base.getTime())) return [];
  const runs: Date[] = [];
  let cur = base;
  for (let i = 0; i < 20; i++) {
    const n = nextRun(cur, result.value.parsed);
    if (!n) break;
    runs.push(n);
    cur = n;
  }
  return runs;
});

function formatTime(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function weekday(d: Date): string {
  return DOW_CN_SHORT[d.getDay()];
}

// ── 可视化生成 ──
interface FieldState {
  mode: 'every' | 'interval' | 'specific';
  step: number;
  specific: string;
}

const builder = reactive({
  secondsEnabled: false,
  seconds: { mode: 'every' as const, step: 5, specific: '0' },
  minute: { mode: 'every' as const, step: 5, specific: '0' },
  hour: { mode: 'every' as const, step: 2, specific: '9' },
  dom: { mode: 'every' as const, step: 1, specific: '1' },
  month: { mode: 'every' as const, step: 1, specific: '1' },
  dow: { mode: 'every' as const, step: 1, specific: '1' },
});

const fieldRows = [
  { key: 'minute', label: '分钟', unit: '分', max: 59, hint: '0-59，如 0,30' },
  { key: 'hour', label: '小时', unit: '时', max: 23, hint: '0-23，如 9,18' },
  { key: 'dom', label: '日期', unit: '日', max: 31, hint: '1-31，如 1,15' },
  { key: 'month', label: '月份', unit: '月', max: 12, hint: '1-12 或 JAN-DEC' },
  { key: 'dow', label: '星期', unit: '周', max: 7, hint: '0-6（0=周日）' },
] as const;

function buildField(f: FieldState): string {
  if (f.mode === 'every') return '*';
  if (f.mode === 'interval') return `*/${f.step}`;
  return f.specific.trim() || '*';
}

const generatedExpr = computed(() => {
  const parts: string[] = [];
  if (builder.secondsEnabled) parts.push(buildField(builder.seconds));
  parts.push(buildField(builder.minute));
  parts.push(buildField(builder.hour));
  parts.push(buildField(builder.dom));
  parts.push(buildField(builder.month));
  parts.push(buildField(builder.dow));
  return parts.join(' ');
});

const generatedDesc = computed(() => {
  try {
    return describeCron(parseCron(generatedExpr.value));
  } catch {
    return '';
  }
});

// 生成结果同步回解析框，便于一键查看下次执行
watch(generatedExpr, (val) => {
  cronInput.value = val;
});
</script>
