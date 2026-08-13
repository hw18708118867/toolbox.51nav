<template>
  <div class="space-y-4">
    <!-- 关键词 -->
    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">搜索关键词</label>
      <input
        v-model="keyword"
        type="text"
        placeholder="如 admin、login、password、config"
        class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none"
        style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);"
      />
      <p class="text-xs mt-1" style="color: var(--color-text-muted);">多个词默认以空格（AND）组合；可用下方"精确短语"或"排除词"细化</p>
    </div>

    <!-- 运算符 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">精确短语 (")</label>
        <input v-model="exact" type="text" placeholder='&quot;admin login&quot;' class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">包含任一词 (OR)</label>
        <input v-model="anyOf" type="text" placeholder="php asp jsp" class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">排除词 (-)</label>
        <input v-model="exclude" type="text" placeholder="forum -shop" class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
      </div>
    </div>

    <!-- 目标站点与 URL -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">限定站点 (site:)</label>
        <input v-model="site" type="text" placeholder="example.com" class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">URL 中包含 (inurl:)</label>
        <input v-model="inurl" type="text" placeholder="admin,login,phpmyadmin" class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">页面文本包含 (intext:)</label>
        <input v-model="intext" type="text" placeholder="confidential" class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">标题包含 (intitle:)</label>
        <input v-model="intitle" type="text" placeholder="index of" class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">文件类型 (filetype:)</label>
        <input v-model="filetype" type="text" placeholder="pdf,sql,bak,env,log" class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">缓存/链接 (link: / cache: / related:)</label>
        <input v-model="linkRef" type="text" placeholder="cache:example.com" class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text);" />
      </div>
    </div>

    <!-- 常见场景模板 -->
    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">常见场景模板（点击套用，可再编辑）</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="t in templates"
          :key="t.label"
          type="button"
          @click="applyTemplate(t)"
          class="px-2.5 py-1 text-xs rounded-full border transition-colors"
          style="border-color: var(--color-border); color: var(--color-text-secondary); background-color: var(--color-bg-secondary);"
          @mouseover="(e: any) => (e.currentTarget.style.borderColor = 'var(--color-primary)')"
          @mouseout="(e: any) => (e.currentTarget.style.borderColor = 'var(--color-border)')"
        >{{ t.label }}</button>
      </div>
    </div>

    <!-- 预设 dork 速选 -->
    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">常见暴露面 dork（勾选追加到关键词）</label>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
        <label v-for="d in presets" :key="d.val" class="flex items-center gap-2 text-xs" style="color: var(--color-text);">
          <input type="checkbox" :value="d.val" v-model="presetSel" />
          {{ d.label }}
        </label>
      </div>
    </div>

    <!-- 输出平台 -->
    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">查询平台</label>
      <div class="flex flex-wrap gap-3">
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="radio" value="google" v-model="engine" /> Google</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="radio" value="bing" v-model="engine" /> Bing</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="radio" value="duckduckgo" v-model="engine" /> DuckDuckGo</label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);"><input type="radio" value="raw" v-model="engine" /> 仅语法（不拼 URL）</label>
      </div>
    </div>

    <!-- 生成结果 -->
    <div class="reveal-item rounded-md border p-3" style="border-color: var(--color-border); backgroundColor: var(--color-bg-secondary);">
      <div class="flex items-center justify-between gap-2 mb-1">
        <span class="text-xs font-medium" style="color: var(--color-text-secondary);">生成的 Google Hacking 语法</span>
        <div class="flex items-center gap-2">
          <a v-if="engine !== 'raw'" :href="queryUrl" target="_blank" rel="noopener noreferrer" class="text-xs px-2 py-1 rounded border" style="border-color: var(--color-primary); color: var(--color-primary);">打开搜索 ↗</a>
          <CopyButton :text="query" />
        </div>
      </div>
      <pre class="text-sm font-mono overflow-x-auto p-2 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap; word-break: break-all;">{{ query }}</pre>
    </div>

    <p class="text-xs" style="color: var(--color-text-muted);">
      仅用于合法授权的信息收集与自身资产暴露面自查。对未授权组织的大规模检索可能触发目标站点防护或违反其服务条款。
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const keyword = ref('');
const exact = ref('');
const anyOf = ref('');
const exclude = ref('');
const site = ref('');
const inurl = ref('');
const intext = ref('');
const intitle = ref('');
const filetype = ref('');
const linkRef = ref('');
const engine = ref('google');
const presetSel = ref<string[]>([]);

const presets = [
  { label: '登录/后台页', val: 'intitle:"admin login"' },
  { label: '目录列表', val: 'intitle:"index of"' },
  { label: '配置文件', val: 'filetype:env' },
  { label: '数据库文件', val: 'filetype:sql' },
  { label: '备份文件', val: 'filetype:bak' },
  { label: '日志文件', val: 'filetype:log' },
  { label: 'phpMyAdmin', val: 'inurl:phpmyadmin' },
  { label: 'Git 泄露', val: 'inurl:".git" ext:git' },
  { label: 'SVN 泄露', val: 'inurl:"/.svn/entries"' },
  { label: '摄像头/设备', val: 'intitle:"webcam"' },
  { label: '敏感文档', val: 'filetype:pdf "confidential"' },
  { label: '错误/调试', val: 'intext:"sql syntax error"' },
];

const templates = [
  { label: '查后台入口', patch: { inurl: 'admin,login', intitle: 'admin login' } },
  { label: '找目录列表', patch: { intitle: 'index of', filetype: '' } },
  { label: '找配置文件泄露', patch: { filetype: 'env', keyword: '' } },
  { label: '找数据库备份', patch: { filetype: 'sql', keyword: '' } },
  { label: '找 Git 泄露', patch: { inurl: '.git', keyword: '' } },
  { label: '找 phpMyAdmin', patch: { inurl: 'phpmyadmin', keyword: '' } },
];

function applyTemplate(t: { label: string; patch: Record<string, string | undefined> }) {
  if ('inurl' in t.patch) inurl.value = t.patch.inurl ?? '';
  if ('intitle' in t.patch) intitle.value = t.patch.intitle ?? '';
  if ('filetype' in t.patch) filetype.value = t.patch.filetype ?? '';
  if ('keyword' in t.patch) keyword.value = t.patch.keyword ?? '';
}

const query = computed(() => {
  const parts: string[] = [];

  presetSel.value.forEach((p) => parts.push(p));

  if (keyword.value.trim()) parts.push(keyword.value.trim());
  if (exact.value.trim()) parts.push(`"${exact.value.trim()}"`);
  if (anyOf.value.trim()) {
    const items = anyOf.value.trim().split(/\s+/).filter(Boolean);
    if (items.length) parts.push(`(${items.join(' OR ')})`);
  }
  if (exclude.value.trim()) {
    exclude.value.trim().split(/\s+/).filter(Boolean).forEach((w) => parts.push(`-${w}`));
  }
  if (site.value.trim()) parts.push(`site:${site.value.trim()}`);
  if (inurl.value.trim()) {
    inurl.value.trim().split(/[,\s]+/).filter(Boolean).forEach((w) => parts.push(`inurl:${w}`));
  }
  if (intext.value.trim()) parts.push(`intext:${intext.value.trim()}`);
  if (intitle.value.trim()) parts.push(`intitle:${intitle.value.trim()}`);
  if (filetype.value.trim()) {
    filetype.value.trim().split(/[,\s]+/).filter(Boolean).forEach((w) => parts.push(`filetype:${w}`));
  }
  if (linkRef.value.trim()) parts.push(linkRef.value.trim());

  return parts.join(' ').trim();
});

const queryUrl = computed(() => {
  const q = encodeURIComponent(query.value);
  if (engine.value === 'google') return `https://www.google.com/search?q=${q}`;
  if (engine.value === 'bing') return `https://www.bing.com/search?q=${q}`;
  if (engine.value === 'duckduckgo') return `https://duckduckgo.com/?q=${q}`;
  return '';
});
</script>
