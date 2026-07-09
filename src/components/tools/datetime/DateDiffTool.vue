<template>
  <div class="space-y-4">
    <TabView :tabs="['两个日期相差', '日期加 / 减']">
      <!-- 两个日期相差 -->
      <template #tab-0>
        <div class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-medium" style="color: var(--color-text-secondary);">开始日期</label>
              <input v-model="startDate" type="datetime-local" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium" style="color: var(--color-text-secondary);">结束日期</label>
              <input v-model="endDate" type="datetime-local" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);" />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 text-sm" style="color: var(--color-text-secondary);">
              <input type="checkbox" v-model="includeEnd" class="rounded" /> 包含结束当天
            </label>
            <button @click="setTodayEnd" class="text-xs" style="color: var(--color-primary);">结束设为今天</button>
          </div>
          <ErrorAlert :message="error" />
          <div v-if="diff" class="rounded-md border p-4 space-y-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <div class="grid grid-cols-2 gap-3 text-center">
              <div>
                <div class="text-2xl font-bold font-mono" style="color: var(--color-primary);">{{ diff.totalDays }}</div>
                <div class="text-xs" style="color: var(--color-text-muted);">总天数</div>
              </div>
              <div>
                <div class="text-2xl font-bold font-mono" style="color: var(--color-primary);">{{ diff.totalHours }}</div>
                <div class="text-xs" style="color: var(--color-text-muted);">总小时</div>
              </div>
            </div>
            <div class="rounded-md p-3 text-center" style="background: var(--color-bg); border: 1px dashed var(--color-border);">
              <p class="text-sm" style="color: var(--color-text);">{{ diff.human }}</p>
            </div>
            <table class="w-full text-sm" style="border-collapse: collapse;">
              <tbody>
                <tr><td style="color: var(--color-text-muted); padding: 2px 0;">年 / 月 / 日</td><td class="text-right" style="color: var(--color-text);">{{ diff.y }} 年 {{ diff.mo }} 个月 {{ diff.d }} 天</td></tr>
                <tr><td style="color: var(--color-text-muted); padding: 2px 0;">整周</td><td class="text-right" style="color: var(--color-text);">{{ diff.weeks }} 周（余 {{ diff.d }} 天）</td></tr>
                <tr><td style="color: var(--color-text-muted); padding: 2px 0;">工作日（周一至周五）</td><td class="text-right" style="color: var(--color-text);">{{ diff.workdays }} 天</td></tr>
                <tr><td style="color: var(--color-text-muted); padding: 2px 0;">开始星期</td><td class="text-right" style="color: var(--color-text);">{{ diff.startWeek }}</td></tr>
                <tr><td style="color: var(--color-text-muted); padding: 2px 0;">结束星期</td><td class="text-right" style="color: var(--color-text);">{{ diff.endWeek }}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- 日期加 / 减 -->
      <template #tab-1>
        <div class="space-y-3">
          <div class="space-y-1">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">基准日期</label>
            <input v-model="baseDate" type="date" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);" />
          </div>
          <div class="flex items-center gap-3">
            <select v-model="calcOp" class="rounded-md border px-2 py-1.5 text-sm" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);">
              <option value="add">加上</option>
              <option value="sub">减去</option>
            </select>
            <input v-model.number="calcNum" type="number" min="0" class="w-24 rounded-md border px-2 py-1.5 text-sm" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);" />
            <select v-model="calcUnit" class="flex-1 rounded-md border px-2 py-1.5 text-sm" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);">
              <option value="day">天</option>
              <option value="week">周</option>
              <option value="month">个月</option>
              <option value="year">年</option>
            </select>
          </div>
          <div v-if="calcResult" class="rounded-md border p-4 space-y-2" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
            <div class="text-center text-xl font-mono font-medium" style="color: var(--color-primary);">{{ calcResult.date }}</div>
            <p class="text-xs text-center" style="color: var(--color-text-muted);">{{ calcResult.week }}</p>
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

const pad = (n: number) => String(n).padStart(2, '0');
const DOW = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const DAY = 86400000;

function parseDt(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s.length <= 10 ? s + 'T00:00:00' : s);
  if (isNaN(d.getTime())) return null;
  return d;
}

function toDateInput(d: Date): string {
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`;
}

function toDtInput(d: Date): string {
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
}

// 日历上的"年/月/日"差值（早于 -> 晚于），已处理大小月与月末
function calendarDiff(early: Date, late: Date): { y: number; mo: number; d: number } {
  let yc = late.getFullYear() - early.getFullYear();
  let mc = late.getMonth() - early.getMonth();
  let dc = late.getDate() - early.getDate();
  if (dc < 0) {
    mc--;
    dc += new Date(late.getFullYear(), late.getMonth(), 0).getDate();
  }
  if (mc < 0) {
    yc--;
    mc += 12;
  }
  return { y: yc, mo: mc, d: dc };
}

const startDate = ref('');
const endDate = ref('');
const includeEnd = ref(true);
const error = ref('');

const diff = computed(() => {
  error.value = '';
  const a = parseDt(startDate.value);
  const b = parseDt(endDate.value);
  if (!a || !b) {
    error.value = '请填写开始和结束日期';
    return null;
  }
  const ms = Math.abs(b.getTime() - a.getTime());
  let totalDays = Math.floor(ms / DAY);
  if (includeEnd.value && ms > 0) totalDays += 1;
  const totalHours = Math.floor(ms / 3600000);

  const neg = b.getTime() < a.getTime();
  const cd = calendarDiff(neg ? b : a, neg ? a : b);
  const weeks = Math.floor(totalDays / 7);

  // 工作日计数
  let workdays = 0;
  const cur = new Date(a.getTime());
  const end = new Date(b.getTime());
  if (end >= cur) {
    while (cur < end) {
      const wd = cur.getDay();
      if (wd !== 0 && wd !== 6) workdays++;
      cur.setDate(cur.getDate() + 1);
    }
  }

  const human = (neg ? '结束日期早于开始日期，以下为绝对值：' : '') +
    `${cd.y} 年 ${cd.mo} 个月 ${cd.d} 天`;

  return {
    totalDays,
    totalHours,
    y: neg ? -cd.y : cd.y,
    mo: neg ? -cd.mo : cd.mo,
    d: neg ? -cd.d : cd.d,
    weeks,
    workdays,
    startWeek: DOW[a.getDay()],
    endWeek: DOW[b.getDay()],
    human,
  };
});

const baseDate = ref('');
const calcOp = ref<'add' | 'sub'>('add');
const calcNum = ref(30);
const calcUnit = ref<'day' | 'week' | 'month' | 'year'>('day');

function addMonths(date: Date, n: number): Date {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, dim));
  return d;
}

const calcResult = computed(() => {
  const base = parseDt(baseDate.value);
  if (!base) return null;
  const n = calcNum.value || 0;
  const sign = calcOp.value === 'add' ? 1 : -1;
  const d = new Date(base.getTime());
  if (calcUnit.value === 'day') d.setDate(d.getDate() + sign * n);
  else if (calcUnit.value === 'week') d.setDate(d.getDate() + sign * n * 7);
  else if (calcUnit.value === 'month') d.setTime(addMonths(d, sign * n).getTime());
  else if (calcUnit.value === 'year') d.setFullYear(d.getFullYear() + sign * n);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    week: DOW[d.getDay()],
  };
});

function setTodayEnd() {
  endDate.value = toDtInput(new Date());
}

onMounted(() => {
  const now = new Date();
  startDate.value = toDtInput(now);
  endDate.value = toDtInput(now);
  baseDate.value = toDateInput(now);
});
</script>
