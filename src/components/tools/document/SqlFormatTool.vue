<template>
  <div class="space-y-4">
    <TabView :tabs="['格式化', '压缩']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="input" label="输入 SQL" placeholder="SELECT id,name FROM users WHERE age>18 ORDER BY name;" :rows="10" show-count />
          <div class="flex flex-wrap items-center gap-4">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">缩进</label>
            <select v-model="indent" class="rounded-md border px-3 py-1.5 text-sm" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);">
              <option :value="2">2 空格</option>
              <option :value="4">4 空格</option>
              <option :value="'tab'">Tab</option>
            </select>
            <label class="flex items-center gap-2 text-sm" style="color: var(--color-text-secondary);">
              <input type="checkbox" v-model="upper" class="rounded" /> 关键字大写
            </label>
          </div>
          <div class="flex justify-end">
            <button @click="format" class="btn-primary">格式化</button>
          </div>
          <ErrorAlert :message="error" />
          <TextOutput v-model="output" label="格式化结果" :rows="12" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="compressInput" label="输入 SQL" placeholder="SELECT id, name FROM users WHERE age > 18;" :rows="10" show-count />
          <div class="flex justify-end">
            <button @click="compress" class="btn-primary">压缩</button>
          </div>
          <ErrorAlert :message="compressError" />
          <TextOutput v-model="compressOutput" label="压缩结果" :rows="8" />
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import TabView from '../../common/TabView.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'LIKE', 'BETWEEN', 'EXISTS',
  'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT', 'AS', 'ON', 'USING',
  'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS', 'NATURAL', 'UNION', 'ALL',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'REPLACE', 'MERGE',
  'CREATE', 'TABLE', 'VIEW', 'INDEX', 'DROP', 'ALTER', 'ADD', 'COLUMN', 'TRUNCATE',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'CAST', 'WITH', 'RETURNING',
  'ASC', 'DESC', 'INTERVAL', 'TRUE', 'FALSE', 'UNKNOWN',
]);

interface Tok { type: 'word' | 'string' | 'number' | 'punc' | 'comment' | 'ws'; val: string; }

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '-' && src[i + 1] === '-') {
      let e = src.indexOf('\n', i); if (e === -1) e = n;
      out.push({ type: 'comment', val: src.slice(i, e) }); i = e; continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      let e = src.indexOf('*/', i); e = e === -1 ? n : e + 2;
      out.push({ type: 'comment', val: src.slice(i, e) }); i = e; continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      const q = c; let j = i + 1;
      while (j < n) {
        if (src[j] === q) {
          if (q === "'" && src[j + 1] === "'") { j += 2; continue; }
          j++; break;
        }
        if (src[j] === '\\' && q !== "'") { j += 2; continue; }
        j++;
      }
      out.push({ type: 'string', val: src.slice(i, j) }); i = j; continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      let j = i + 1; while (j < n && /[0-9.]/.test(src[j])) j++;
      out.push({ type: 'number', val: src.slice(i, j) }); i = j; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i + 1; while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
      out.push({ type: 'word', val: src.slice(i, j) }); i = j; continue;
    }
    if (/\s/.test(c)) {
      let j = i + 1; while (j < n && /\s/.test(src[j])) j++;
      out.push({ type: 'ws', val: src.slice(i, j) }); i = j; continue;
    }
    out.push({ type: 'punc', val: c }); i++;
  }
  return out;
}

const JOIN_PREFIX = new Set(['INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'NATURAL', 'OUTER']);

function formatSql(src: string, indentStr: string, upper: boolean): string {
  const raw = tokenize(src).filter((t) => t.type !== 'ws');
  const isKw = (w: string) => SQL_KEYWORDS.has(w.toUpperCase());
  let res = '';
  let paren = 0;
  let clause = 0;
  let atLineStart = true;
  const indent = () => indentStr.repeat(paren + clause);

  for (let i = 0; i < raw.length; i++) {
    const tk = raw[i];
    const next = raw[i + 1];
    let text = tk.val;
    if (tk.type === 'word' && isKw(text)) text = upper ? text.toUpperCase() : text.toLowerCase();
    const u = tk.type === 'word' ? text.toUpperCase() : '';
    const nextU = next && next.type === 'word' ? next.val.toUpperCase() : '';

    let newlineBefore = false;
    if (tk.type === 'word') {
      if (['SELECT', 'FROM', 'WHERE', 'HAVING', 'UNION', 'INSERT', 'UPDATE', 'DELETE', 'VALUES', 'RETURNING', 'WITH', 'MERGE', 'SET'].includes(u)) {
        newlineBefore = true; clause = 0;
      } else if ((u === 'GROUP' && nextU === 'BY') || (u === 'ORDER' && nextU === 'BY')) {
        newlineBefore = true; clause = 0;
      } else if (u === 'LIMIT' || u === 'OFFSET') {
        newlineBefore = true; clause = 0;
      } else if (u === 'JOIN') {
        newlineBefore = true; clause = 1;
      } else if (u === 'ON') {
        newlineBefore = true; clause = 2;
      } else if (u === 'AND' || u === 'OR') {
        newlineBefore = true; clause = 2;
      } else if (u === 'CASE') {
        newlineBefore = true; clause += 1;
      } else if (u === 'WHEN' || u === 'THEN' || u === 'ELSE' || u === 'END') {
        newlineBefore = true;
      }
    } else if (tk.type === 'comment') {
      newlineBefore = !atLineStart;
    }

    if (newlineBefore && !atLineStart) {
      res += '\n' + indent();
      atLineStart = true;
    }
    if (atLineStart) { res += indent(); atLineStart = false; }

    if (tk.type === 'punc') {
      if (text === '(') {
        res += '('; paren++;
        if (next && next.type === 'word' && next.val.toUpperCase() === 'SELECT') { res += '\n' + indent(); atLineStart = true; }
        else atLineStart = false;
      } else if (text === ')') {
        paren = Math.max(0, paren - 1);
        res += '\n' + indent() + ')';
        atLineStart = true;
        if (clause > 0 && u === '' ) clause = Math.max(0, clause - 1);
      } else if (text === ',') {
        res += ',';
        // newline after comma in SELECT/field list for readability
        if (next && next.type === 'word') { res += '\n' + indent(); atLineStart = true; }
        else atLineStart = false;
      } else if (text === '.') {
        res = res.replace(/\s+$/, ''); res += '.'; atLineStart = false;
      } else if (text === ';') {
        res += ';'; atLineStart = true;
        if (i + 1 < raw.length) res += '\n';
      } else {
        if (!atLineStart && !/\s$/.test(res)) res += ' ';
        res += text; atLineStart = false;
      }
    } else {
      if (!atLineStart && !/\s$/.test(res)) res += ' ';
      res += text; atLineStart = false;
    }
  }
  return res.trim();
}

function compressSql(src: string): string {
  return tokenize(src)
    .filter((t) => t.type !== 'ws')
    .map((t) => (t.type === 'comment' ? '' : t.val))
    .join('')
    .replace(/\s*([(),;.])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const input = ref('');
const indent = ref<number | string>(2);
const upper = ref(true);
const output = ref('');
const error = ref('');

const compressInput = ref('');
const compressOutput = ref('');
const compressError = ref('');

function format() {
  error.value = '';
  try {
    if (!input.value.trim()) { error.value = '请输入 SQL'; return; }
    const indentStr = indent.value === 'tab' ? '\t' : ' '.repeat(Number(indent.value));
    output.value = formatSql(input.value, indentStr, upper.value);
  } catch (e: any) {
    error.value = '格式化失败: ' + (e?.message || String(e));
  }
}

function compress() {
  compressError.value = '';
  try {
    if (!compressInput.value.trim()) { compressError.value = '请输入 SQL'; return; }
    compressOutput.value = compressSql(compressInput.value);
  } catch (e: any) {
    compressError.value = '压缩失败: ' + (e?.message || String(e));
  }
}
</script>
