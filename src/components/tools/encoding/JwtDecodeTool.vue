<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入 JWT Token" placeholder="请输入 JWT Token（如 eyJhbGciOiJIUzI1NiIs...）" :rows="4" show-count />
    <div class="flex justify-end">
      <button @click="decode" class="btn-primary">
        解码
      </button>
    </div>
    <ErrorAlert :message="error" />

    <div v-if="header" class="space-y-4">
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <h3 class="text-sm font-medium" style="color: var(--color-text);">Header（头部）</h3>
          <CopyButton :text="headerJson" />
        </div>
        <pre class="tool-input rounded-md border p-3 text-xs overflow-auto" >{{ headerJson }}</pre>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1.5">
          <h3 class="text-sm font-medium" style="color: var(--color-text);">Payload（载荷）</h3>
          <CopyButton :text="payloadJson" />
        </div>
        <pre class="tool-input rounded-md border p-3 text-xs overflow-auto" >{{ payloadJson }}</pre>

        <!-- 时间戳解析 -->
        <div v-if="timeClaims.length > 0" class="mt-2 rounded-md border p-3" style="background-color: var(--color-bg-tertiary); border-color: var(--color-border);">
          <h4 class="text-xs font-medium mb-2" style="color: var(--color-text);">时间戳解析</h4>
          <div v-for="claim in timeClaims" :key="claim.key" class="text-xs flex gap-2 mb-1">
            <span class="font-mono" style="color: var(--color-text-secondary);">{{ claim.key }}:</span>
            <span style="color: var(--color-text);">{{ claim.value }}</span>
          </div>
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1.5">
          <h3 class="text-sm font-medium" style="color: var(--color-text);">Signature（签名）</h3>
        </div>
        <pre class="tool-input rounded-md border p-3 text-xs overflow-auto" style="background-color: var(--color-bg); border-color: var(--color-border); color: var(--color-text-muted);">{{ signature }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TextInput from '../../common/TextInput.vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const input = ref('');
const error = ref('');
const header = ref<any>(null);
const payload = ref<any>(null);
const signature = ref('');

const headerJson = computed(() => header.value ? JSON.stringify(header.value, null, 2) : '');
const payloadJson = computed(() => payload.value ? JSON.stringify(payload.value, null, 2) : '');

const timeClaimKeys = ['iat', 'exp', 'nbf', 'auth_time'];

const timeClaims = computed(() => {
  if (!payload.value) return [];
  return timeClaimKeys
    .filter((key) => payload.value[key] !== undefined)
    .map((key) => ({
      key,
      value: new Date(payload.value[key] * 1000).toLocaleString('zh-CN'),
    }));
});

function decode() {
  error.value = '';
  header.value = null;
  payload.value = null;
  signature.value = '';

  try {
    const token = input.value.trim();
    const parts = token.split('.');
    if (parts.length !== 3) {
      error.value = '无效的 JWT 格式：JWT 应包含 3 个部分（用 . 分隔）';
      return;
    }

    const decodeB64 = (str: string) => {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      return decodeURIComponent(escape(atob(base64)));
    };

    header.value = JSON.parse(decodeB64(parts[0]));
    payload.value = JSON.parse(decodeB64(parts[1]));
    signature.value = parts[2];
  } catch {
    error.value = '解码失败: 输入不是有效的 JWT Token';
  }
}
</script>
