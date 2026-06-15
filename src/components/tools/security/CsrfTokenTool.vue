<template>
  <div class="space-y-4">
    <p class="text-sm" style="color: var(--color-text-secondary);">CSRF Token 用于防止跨站请求伪造攻击。点击按钮生成随机 Token：</p>
    <div class="flex items-center gap-4">
      <label class="text-xs" style="color: var(--color-text-secondary);">长度</label>
      <select v-model="length" class="rounded-md border px-3 py-1.5 text-sm" style="border-color: var(--color-border); color: var(--color-text); background-color: var(--color-bg);">
        <option :value="32">32 字节</option>
        <option :value="64">64 字节</option>
        <option :value="128">128 字节</option>
      </select>
    </div>
    <div class="flex justify-end">
      <button @click="generate" class="btn-primary">生成 Token</button>
    </div>
    <div v-if="token" class="rounded-md border p-4 space-y-3" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium" style="color: var(--color-text);">CSRF Token</span>
        <CopyButton :text="token" />
      </div>
      <code class="text-xs break-all block" style="color: var(--color-primary);">{{ token }}</code>
      <div class="rounded-md border p-3 mt-2" style="border-color: var(--color-border); background-color: var(--color-bg-tertiary);">
        <p class="text-xs font-medium mb-1" style="color: var(--color-text-secondary);">隐藏域 HTML 代码：</p>
        <code class="text-xs break-all" style="color: var(--color-text);">&lt;input type="hidden" name="_csrf" value="{{ token }}" /&gt;</code>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import CopyButton from '../../common/CopyButton.vue';
const length = ref(32);
const token = ref('');
function generate() {
  const bytes = new Uint8Array(length.value);
  crypto.getRandomValues(bytes);
  token.value = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
</script>
