<template>
  <div class="space-y-4">
    <TabView :tabs="['格式化', '压缩']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="input" label="输入 HTML" placeholder="<div><p>Hello <b>World</b></p></div>" :rows="10" show-count />
          <div class="flex flex-wrap items-center gap-4">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">缩进</label>
            <select v-model="indent" class="rounded-md border px-3 py-1.5 text-sm" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);">
              <option :value="2">2 空格</option>
              <option :value="4">4 空格</option>
              <option :value="'tab'">Tab</option>
            </select>
            <label class="flex items-center gap-2 text-sm" style="color: var(--color-text-secondary);">
              <input type="checkbox" v-model="collapseWs" class="rounded" /> 折叠多余空白
            </label>
            <label class="flex items-center gap-2 text-sm" style="color: var(--color-text-secondary);">
              <input type="checkbox" v-model="lowerCase" class="rounded" /> 标签名转小写
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
          <TextInput v-model="compressInput" label="输入 HTML" placeholder="<div>  <p>  Hello  </p>  </div>" :rows="10" show-count />
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 text-sm" style="color: var(--color-text-secondary);">
              <input type="checkbox" v-model="keepComments" class="rounded" /> 保留注释
            </label>
          </div>
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

interface Token { type: 'tag' | 'comment' | 'doctype' | 'cdata' | 'text'; text: string; }

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i);
      const e = end === -1 ? n : end + 3;
      tokens.push({ type: 'comment', text: src.slice(i, e) });
      i = e;
    } else if (src.startsWith('<![', i)) {
      const end = src.indexOf(']]>', i);
      const e = end === -1 ? n : end + 3;
      tokens.push({ type: 'cdata', text: src.slice(i, e) });
      i = e;
    } else if (src.startsWith('<!', i)) {
      const end = src.indexOf('>', i);
      const e = end === -1 ? n : end + 1;
      tokens.push({ type: 'doctype', text: src.slice(i, e) });
      i = e;
    } else if (src[i] === '<') {
      const end = src.indexOf('>', i);
      const e = end === -1 ? n : end + 1;
      tokens.push({ type: 'tag', text: src.slice(i, e) });
      i = e;
    } else {
      const next = src.indexOf('<', i);
      const e = next === -1 ? n : next;
      tokens.push({ type: 'text', text: src.slice(i, e) });
      i = e;
    }
  }
  return tokens;
}

function formatHtml(src: string, indentStr: string, collapseWs: boolean, lowerCase: boolean): string {
  const tokens = tokenize(src);
  let depth = 0;
  const pad = (d: number) => indentStr.repeat(Math.max(0, d));
  const lines: string[] = [];
  for (const t of tokens) {
    if (t.type === 'text') {
      if (!t.text.trim()) continue;
      const txt = collapseWs ? t.text.replace(/\s+/g, ' ').trim() : t.text.replace(/\n\s*/g, ' ').trim();
      if (txt) lines.push(pad(depth) + txt);
      continue;
    }
    if (t.type === 'comment' || t.type === 'doctype' || t.type === 'cdata') {
      lines.push(pad(depth) + t.text);
      continue;
    }
    let tag = t.text;
    const isClose = /^<\//.test(tag);
    const isSelf = /\/>$/.test(tag) || /^<\s*(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/i.test(tag);
    if (lowerCase) {
      tag = tag.replace(/^<\/?\s*([a-zA-Z0-9-]+)/, (m, name) => m.replace(name, name.toLowerCase()));
    }
    if (isClose) {
      depth = Math.max(0, depth - 1);
      lines.push(pad(depth) + tag);
    } else {
      lines.push(pad(depth) + tag);
      if (!isSelf) depth++;
    }
  }
  return lines.join('\n');
}

function compressHtml(src: string, keepComments: boolean): string {
  let s = src;
  if (!keepComments) s = s.replace(/<!--[\s\S]*?-->/g, '');
  return s
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim();
}

const input = ref('');
const indent = ref<number | string>(2);
const collapseWs = ref(true);
const lowerCase = ref(false);
const output = ref('');
const error = ref('');

const compressInput = ref('');
const keepComments = ref(false);
const compressOutput = ref('');
const compressError = ref('');

function format() {
  error.value = '';
  try {
    if (!input.value.trim()) { error.value = '请输入 HTML'; return; }
    const indentStr = indent.value === 'tab' ? '\t' : ' '.repeat(Number(indent.value));
    output.value = formatHtml(input.value, indentStr, collapseWs.value, lowerCase.value);
  } catch (e: any) {
    error.value = '格式化失败: ' + (e?.message || String(e));
  }
}

function compress() {
  compressError.value = '';
  try {
    if (!compressInput.value.trim()) { compressError.value = '请输入 HTML'; return; }
    compressOutput.value = compressHtml(compressInput.value, keepComments.value);
  } catch (e: any) {
    compressError.value = '压缩失败: ' + (e?.message || String(e));
  }
}
</script>
