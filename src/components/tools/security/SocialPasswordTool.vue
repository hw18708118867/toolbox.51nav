<template>
  <div class="space-y-5">
    <NoticeAlert message="⚠️ 本工具仅用于授权范围内的安全测试与安全意识评估（如企业红队、密码策略审计）。严禁用于未经授权的渗透或侵犯他人隐私，使用即表示你已获得合法授权。" />

    <!-- ① 目标公开信息 -->
    <section class="space-y-3">
      <h3 class="text-sm font-bold" style="color: var(--color-text);">① 目标公开信息</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">名 / First name</label>
          <input v-model="firstName" type="text" placeholder="如 伟" :style="inp" class="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">姓 / Last name</label>
          <input v-model="lastName" type="text" placeholder="如 王" :style="inp" class="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">昵称 / 网名</label>
          <input v-model="nickname" type="text" placeholder="如 xiaowang" :style="inp" class="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">生日</label>
          <input v-model="birthDate" type="date" :style="inp" class="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">配偶 / 伴侣 姓名</label>
          <input v-model="spouse" type="text" placeholder="如 丽" :style="inp" class="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">子女 姓名</label>
          <input v-model="child" type="text" placeholder="如 小明" :style="inp" class="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">宠物 名字</label>
          <input v-model="pet" type="text" placeholder="如 tom" :style="inp" class="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">公司 / 组织</label>
          <input v-model="company" type="text" placeholder="如 acme" :style="inp" class="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">城市 / 地名</label>
          <input v-model="city" type="text" placeholder="如 beijing" :style="inp" class="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">关键词（逗号分隔）</label>
          <input v-model="keywords" type="text" placeholder="足球, 游戏, 2024" :style="inp" class="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">重要数字（逗号分隔）</label>
          <input v-model="numbers" type="text" placeholder="138..., 123456" :style="inp" class="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
      </div>
      <button @click="fillExample" class="text-xs underline" style="color: var(--color-text-muted);">填入示例数据</button>
    </section>

    <!-- ② 变换选项 -->
    <section class="space-y-3">
      <h3 class="text-sm font-bold" style="color: var(--color-text);">② 变换策略</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
          <input v-model="useCase" type="checkbox" class="rounded" style="accent-color: var(--color-primary);" /> 大小写变体（小写 / 大写 / 首字母大写 / 反写）
        </label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
          <input v-model="useLeet" type="checkbox" class="rounded" style="accent-color: var(--color-primary);" /> Leet 替换（a→@ e→3 i→1 o→0 s→$ t→7）
        </label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
          <input v-model="useYears" type="checkbox" class="rounded" style="accent-color: var(--color-primary);" /> 追加年份 / 生日数字
        </label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
          <input v-model="useCommon" type="checkbox" class="rounded" style="accent-color: var(--color-primary);" /> 追加常见后缀（123 ! @ # 520 …）
        </label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
          <input v-model="useKeyboard" type="checkbox" class="rounded" style="accent-color: var(--color-primary);" /> 追加键盘模式（qwer 1qaz !@# …）
        </label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
          <input v-model="useSep" type="checkbox" class="rounded" style="accent-color: var(--color-primary);" /> 组合时使用分隔符（. _ -）
        </label>
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">最大生成数量（防止词表过大）</label>
        <input v-model.number="maxResults" type="number" min="100" max="50000" step="100" :style="inp" class="w-40 rounded-md border px-3 py-2 text-sm" />
      </div>
    </section>

    <div class="flex items-center gap-3">
      <button @click="generate" class="btn-primary">生成词表</button>
      <button @click="reset" class="text-xs underline" style="color: var(--color-text-muted);">清空</button>
    </div>

    <ErrorAlert :message="error" />

    <section v-if="resultText" class="space-y-2">
      <div class="flex items-center justify-between">
        <p class="text-xs" style="color: var(--color-text-secondary);">共生成 <span class="font-bold" style="color: var(--color-text);">{{ count }}</span> 条候选密码（按长度排序）</p>
        <button @click="download" class="text-xs px-3 py-1.5 rounded-lg no-underline transition-all duration-300 hover:opacity-90" style="background: var(--color-primary); color: #fff;">下载 .txt</button>
      </div>
      <TextOutput :modelValue="resultText" :rows="14" label="社工密码候选词表" />
      <p class="text-xs leading-relaxed" style="color: var(--color-text-muted);">
        将结果导入 Hashcat / John 等工具做定向字典攻击，仅限授权目标。若其中大量组合能命中，说明该账号的密码策略存在被社工信息猜解的风险，应强制使用随机高熵口令 + 多因素认证。
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';
import NoticeAlert from '../../common/NoticeAlert.vue';
import TextOutput from '../../common/TextOutput.vue';

const inp = {
  backgroundColor: 'var(--color-bg-tertiary)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
};

const firstName = ref('');
const lastName = ref('');
const nickname = ref('');
const birthDate = ref('');
const spouse = ref('');
const child = ref('');
const pet = ref('');
const company = ref('');
const city = ref('');
const keywords = ref('');
const numbers = ref('');

const useCase = ref(true);
const useLeet = ref(true);
const useYears = ref(true);
const useCommon = ref(true);
const useKeyboard = ref(false);
const useSep = ref(true);
const maxResults = ref(3000);

const error = ref('');
const resultText = ref('');
const count = ref(0);

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
function invertCase(s: string): string {
  return s.split('').map(c => c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase()).join('');
}
function leet(s: string): string {
  const map: Record<string, string> = { a: '@', e: '3', i: '1', o: '0', s: '$', t: '7', l: '1', g: '9', b: '8' };
  return s.split('').map(c => map[c.toLowerCase()] ?? c).join('');
}

function buildPool(): string[] {
  const raw: string[] = [];
  const push = (s: string) => { const t = s.trim(); if (t) raw.push(t); };

  push(firstName.value);
  push(lastName.value);
  push(nickname.value);
  push(spouse.value);
  push(child.value);
  push(pet.value);
  push(company.value);
  push(city.value);
  keywords.value.split(/[,，\s]+/).forEach(push);
  numbers.value.split(/[,，\s]+/).forEach(push);

  if (birthDate.value) {
    const m = birthDate.value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (m) {
      const y = m[1];
      const mo = m[2].padStart(2, '0');
      const d = m[3].padStart(2, '0');
      push(y); push(y.slice(2)); push(mo); push(d);
      push(y + mo + d);
      push(`${y}-${mo}-${d}`); push(`${y}.${mo}.${d}`); push(`${y}/${mo}/${d}`);
      push(d + mo + y); push(`${d}-${mo}-${y}`);
    }
  }

  const out = new Set<string>();
  for (const w of raw) {
    out.add(w);
    if (useCase.value) {
      out.add(w.toLowerCase());
      out.add(w.toUpperCase());
      out.add(capitalize(w));
      out.add(invertCase(w));
    }
    if (useLeet.value) {
      const l = leet(w);
      out.add(l);
      if (useCase.value) out.add(l.toUpperCase());
    }
  }
  return [...out].filter(w => w.length > 0);
}

function buildSuffixes(): string[] {
  const s: string[] = [''];
  if (useYears.value) {
    const yrs: string[] = [];
    const y = birthDate.value.slice(0, 4);
    if (/^\d{4}$/.test(y)) { yrs.push(y, y.slice(2)); }
    const cur = new Date().getFullYear();
    [0, -1, -2, -3, 1].forEach(o => yrs.push(String(cur + o)));
    yrs.forEach(v => s.push(v));
  }
  if (useCommon.value) {
    ['1', '12', '123', '1234', '12345', '123456', '!', '@', '#', '$', '!@#', '1!', '!!', '2023', '2024', '2025', '520', '1314', '666', '888']
      .forEach(v => s.push(v));
  }
  if (useKeyboard.value) {
    ['qwer', 'asdf', 'zxcv', '1qaz', '2wsx', 'qwerty', '123', '111', '000', '!@#', '!@#$', 'qaz']
      .forEach(v => s.push(v));
  }
  return s;
}

function generate() {
  error.value = '';
  resultText.value = '';
  const pool = buildPool();
  if (pool.length === 0) {
    error.value = '请至少填写一项信息（如姓名、生日或关键词）';
    return;
  }
  const suffixes = buildSuffixes();
  const seps = useSep.value ? ['', '.', '_', '-'] : [''];
  const MAX = Math.max(100, Math.min(50000, maxResults.value || 3000));
  const result = new Set<string>();
  const add = (v: string) => { if (result.size < MAX && v) result.add(v); };

  for (const w of pool) {
    add(w);
    for (const suf of suffixes) add(w + suf);
  }
  for (const a of pool) {
    for (const b of pool) {
      for (const sep of seps) {
        const c = sep ? a + sep + b : a + b;
        add(c);
        for (const suf of suffixes) add(c + suf);
      }
    }
  }

  let list = [...result];
  list.sort((x, y) => x.length - y.length || (x < y ? -1 : x > y ? 1 : 0));
  if (list.length > MAX) list = list.slice(0, MAX);
  resultText.value = list.join('\n');
  count.value = list.length;
}

function download() {
  if (!resultText.value) return;
  const blob = new Blob([resultText.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'social-password-wordlist.txt';
  a.click();
  URL.revokeObjectURL(url);
}

function reset() {
  firstName.value = lastName.value = nickname.value = birthDate.value = '';
  spouse.value = child.value = pet.value = company.value = city.value = '';
  keywords.value = numbers.value = '';
  resultText.value = '';
  count.value = 0;
  error.value = '';
}

function fillExample() {
  firstName.value = '伟';
  lastName.value = '王';
  nickname.value = 'xiaowang';
  birthDate.value = '1990-01-15';
  spouse.value = '丽';
  child.value = '小明';
  pet.value = 'tom';
  company.value = 'acme';
  city.value = 'beijing';
  keywords.value = '足球, 游戏, 2024';
  numbers.value = '13800138000, 123456';
}
</script>
