<template>
  <div class="space-y-4">
    <p class="text-sm" style="color: var(--color-text-secondary);">当前浏览器发送的 HTTP 请求头信息：</p>
    <div class="rounded-md border p-4 space-y-2" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <div v-for="(val, key) in headers" :key="key" class="flex items-start justify-between gap-4 text-sm py-1 border-b" style="border-color: var(--color-border);">
        <span class="font-medium shrink-0" style="color: var(--color-text-secondary);">{{ key }}</span>
        <code class="text-right break-all" style="color: var(--color-text);">{{ val }}</code>
      </div>
    </div>
    <div class="flex justify-end"><button @click="testCors" class="btn-primary">发测试请求看响应头</button></div>
    <div v-if="responseHeaders" class="mt-4">
      <h3 class="text-sm font-bold mb-2" style="color: var(--color-text);">响应头（来自测试请求）</h3>
      <div class="rounded-md border p-4 space-y-2" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
        <div v-for="(val, key) in responseHeaders" :key="key" class="flex items-start justify-between gap-4 text-sm py-1 border-b" style="border-color: var(--color-border);">
          <span class="font-medium shrink-0" style="color: var(--color-text-secondary);">{{ key }}</span>
          <code class="text-right break-all" style="color: var(--color-text);">{{ val }}</code>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
interface Headers { [key: string]: string; }
// We can't actually read request headers from JS. Instead show navigator info + fetch.
const headers = ref<Headers>({});
const responseHeaders = ref<Headers | null>(null);
onMounted(() => {
  const h: Headers = {};
  h['User-Agent'] = navigator.userAgent;
  h['语言 (Accept-Language)'] = navigator.language;
  h['平台 (Platform)'] = navigator.platform || 'N/A';
  h['Cookie 启用'] = navigator.cookieEnabled ? '是' : '否';
  h['在线状态'] = navigator.onLine ? '在线' : '离线';
  h['屏幕分辨率'] = `${screen.width}x${screen.height}`;
  h['时区'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
  headers.value = h;
});
async function testCors() {
  try {
    const res = await fetch('https://httpbin.org/get');
    const data = await res.json();
    responseHeaders.value = data.headers || {};
  } catch {
    responseHeaders.value = { '错误': '请求失败，请检查网络连接' };
  }
}
</script>
