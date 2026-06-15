<template>
  <div class="space-y-4">
    <div>
      <input
        v-model="urlInput"
        type="text"
        placeholder="请输入 URL，例如: https://example.com:8080/path?key=value#hash"
        class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
        
      />
    </div>

    <div v-if="error" class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm" style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <div v-if="parsed" class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
      <table class="w-full text-sm">
        <tbody>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary); width: 120px;">协议</td>
            <td class="px-4 py-2.5" style="color: var(--color-text);">{{ parsed.protocol }} <CopyButton :text="parsed.protocol" /></td>
          </tr>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">主机</td>
            <td class="px-4 py-2.5" style="color: var(--color-text);">{{ parsed.hostname }} <CopyButton :text="parsed.hostname" /></td>
          </tr>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">端口</td>
            <td class="px-4 py-2.5" style="color: var(--color-text);">{{ parsed.port || '默认' }} <CopyButton v-if="parsed.port" :text="parsed.port" /></td>
          </tr>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">路径</td>
            <td class="px-4 py-2.5" style="color: var(--color-text);">{{ parsed.pathname }} <CopyButton :text="parsed.pathname" /></td>
          </tr>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">哈希</td>
            <td class="px-4 py-2.5" style="color: var(--color-text);">{{ parsed.hash || '无' }} <CopyButton v-if="parsed.hash" :text="parsed.hash" /></td>
          </tr>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <td class="px-4 py-2.5 font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">来源</td>
            <td class="px-4 py-2.5" style="color: var(--color-text);">{{ parsed.origin }} <CopyButton :text="parsed.origin" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="searchParams.length > 0">
      <div class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">查询参数</div>
      <div class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
        <table class="w-full text-sm">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-border);">
              <th class="px-4 py-2 text-left font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary); width: 40%;">Key</th>
              <th class="px-4 py-2 text-left font-medium" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary);">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(param, index) in searchParams" :key="index" :style="index < searchParams.length - 1 ? 'border-bottom: 1px solid var(--color-border);' : ''">
              <td class="px-4 py-2" style="color: var(--color-text);">
                {{ param.key }}
                <CopyButton :text="param.key" />
              </td>
              <td class="px-4 py-2" style="color: var(--color-text);">
                {{ param.value }}
                <CopyButton :text="param.value" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const urlInput = ref('');
const parsed = ref<{ protocol: string; hostname: string; port: string; pathname: string; hash: string; origin: string } | null>(null);
const searchParams = ref<{ key: string; value: string }[]>([]);
const error = ref('');

watch(urlInput, () => {
  parseUrl();
});

function parseUrl() {
  error.value = '';
  parsed.value = null;
  searchParams.value = [];

  const url = urlInput.value.trim();
  if (!url) return;

  try {
    const u = new URL(url);
    parsed.value = {
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port,
      pathname: u.pathname,
      hash: u.hash,
      origin: u.origin,
    };

    const params: { key: string; value: string }[] = [];
    u.searchParams.forEach((value, key) => {
      params.push({ key, value });
    });
    searchParams.value = params;
  } catch {
    error.value = '无效的 URL 格式，请输入完整的 URL（包含协议）';
  }
}
</script>
