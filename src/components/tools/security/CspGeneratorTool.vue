<template>
  <div class="space-y-4">
    <p class="text-sm" style="color: var(--color-text-secondary);">Content Security Policy (CSP) 帮助防止 XSS 等代码注入攻击。配置以下选项生成 CSP 头。</p>
    <div class="space-y-3">
      <div class="flex items-center gap-4" v-for="opt in options" :key="opt.key">
        <span class="text-xs shrink-0 w-24" style="color: var(--color-text-secondary);">{{ opt.label }}</span>
        <input v-model="policies[opt.key]" type="text" class="flex-1 rounded-md border px-3 py-1.5 text-xs font-mono" style="border-color: var(--color-border); color: var(--color-text); background-color: var(--color-bg);" :placeholder="opt.placeholder" />
        <span class="text-[10px] text-right w-32" style="color: var(--color-text-muted);">{{ opt.hint }}</span>
      </div>
    </div>
    <div class="flex justify-end">
      <button @click="generate" class="btn-primary">生成 CSP</button>
    </div>
    <div v-if="csp" class="rounded-md border p-4 space-y-2" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium" style="color: var(--color-text);">Content-Security-Policy</span>
        <CopyButton :text="csp" />
      </div>
      <code class="text-xs break-all font-mono block" style="color: var(--color-primary);">{{ csp }}</code>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import CopyButton from '../../common/CopyButton.vue';
const policies = ref<Record<string, string>>({
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline'",
  'style-src': "'self' 'unsafe-inline'",
  'img-src': "'self' data: https:",
  'font-src': "'self'",
  'connect-src': "'self'",
  'media-src': "'self'",
  'frame-src': "'self'",
  'object-src': "'none'",
  'base-uri': "'self'",
});
const options = [
  { key: 'default-src', label: '默认来源', placeholder: "'self'", hint: '默认策略' },
  { key: 'script-src', label: '脚本来源', placeholder: "'self'", hint: 'JS 加载源' },
  { key: 'style-src', label: '样式来源', placeholder: "'self' 'unsafe-inline'", hint: 'CSS 加载源' },
  { key: 'img-src', label: '图片来源', placeholder: "'self' data:", hint: '图片加载源' },
  { key: 'connect-src', label: '连接来源', placeholder: "'self'", hint: 'XMLHttpRequest' },
  { key: 'frame-src', label: '框架来源', placeholder: "'self'", hint: 'iframe 源' },
  { key: 'base-uri', label: 'base URI', placeholder: "'self'", hint: 'base 标签' },
  { key: 'object-src', label: '插件来源', placeholder: "'none'", hint: 'object/embed' },
];
const csp = ref('');
function generate() {
  csp.value = Object.entries(policies.value)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k} ${v.trim()}`)
    .join('; ');
}
</script>
