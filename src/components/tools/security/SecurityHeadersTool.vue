<template>
  <div class="space-y-4">
    <div class="flex gap-2">
      <input v-model="url" type="text" placeholder="输入 URL（如 https://example.com）" class="flex-1 rounded-md border px-3 py-2 text-sm" style="border-color: var(--color-border); color: var(--color-text); background-color: var(--color-bg);" @keyup.enter="check" />
      <button @click="check" :disabled="loading" class="btn-primary">{{ loading ? '检测中...' : '检测' }}</button>
    </div>
    <ErrorAlert :message="error" />
    <div v-if="result" class="rounded-md border p-4 space-y-2" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <div v-for="h in securityHeaders" :key="h.key" class="flex items-center justify-between text-sm py-1">
        <span style="color: var(--color-text-secondary);">{{ h.label }}</span>
        <span class="flex items-center gap-2">
          <code class="text-xs max-w-[300px] truncate" :style="result[h.key] ? 'color: var(--color-success);' : 'color: var(--color-error);'">{{ result[h.key] || '❌ 未设置' }}</code>
          <span class="text-xs px-1.5 py-0.5 rounded" :style="result[h.key] ? 'background-color:#dcfce7;color:#166534;' : 'background-color:#fee2e2;color:#991b1b;'">{{ result[h.key] ? '✓' : '✗' }}</span>
        </span>
      </div>
      <p class="text-xs mt-3" style="color: var(--color-text-muted);">{{ result.score }}/{{ securityHeaders.length }} 个安全头已配置</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import ErrorAlert from '../../common/ErrorAlert.vue';
const url = ref('');
const result = ref<Record<string,string>>();
const error = ref('');
const loading = ref(false);
const securityHeaders = [
  { label: 'Content-Security-Policy', key: 'content-security-policy' },
  { label: 'X-Content-Type-Options', key: 'x-content-type-options' },
  { label: 'X-Frame-Options', key: 'x-frame-options' },
  { label: 'X-XSS-Protection', key: 'x-xss-protection' },
  { label: 'Strict-Transport-Security', key: 'strict-transport-security' },
  { label: 'Referrer-Policy', key: 'referrer-policy' },
  { label: 'Permissions-Policy', key: 'permissions-policy' },
];
async function check() {
  error.value = ''; result.value = undefined; loading.value = true;
  try {
    const u = url.value.startsWith('http') ? url.value : 'https://' + url.value;
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, { mode: 'cors' });
    // Can't read response headers from CORS proxy. Use direct explanation.
    result.value = {};
    let score = 0;
    for (const h of securityHeaders) result.value[h.key] = '';
    // Since we can't really read headers from JS cross-origin, show info message
    error.value = '注意：浏览器端无法直接读取跨域响应头。请在服务器端查看安全头，或使用浏览器开发者工具。以下为标准检查清单。';
    result.value.score = '0';
    loading.value = false;
  } catch {
    error.value = '检测失败，请检查 URL 是否正确';
    loading.value = false;
  }
}
</script>
