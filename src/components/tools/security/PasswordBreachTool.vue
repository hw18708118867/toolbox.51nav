<template>
  <div class="space-y-4">
    <!-- 密码输入 -->
    <div>
      <label class="text-xs font-medium mb-1.5 block" style="color: var(--color-text-secondary);">输入密码</label>
      <div class="relative">
        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="请输入要检测的密码"
          class="w-full rounded-md border px-3 py-2 text-sm pr-10 focus:outline-none "
          
          @keydown.enter="checkBreach"
        />
        <button
          @click="showPassword = !showPassword"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-1"
          style="color: var(--color-text-muted);"
          title="显示/隐藏密码"
        >
          <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 检测按钮 -->
    <div class="flex justify-end">
      <button
        @click="checkBreach"
        :disabled="loading || !password"
        class="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
        style="background-color: var(--color-primary);"
      >
        {{ loading ? '检测中...' : '检测' }}
      </button>
    </div>

    <ErrorAlert :message="error" />

    <!-- 结果展示 -->
    <div v-if="result !== null" class="rounded-lg border p-4" :style="result > 0
      ? 'background-color: #fef2f2; border-color: #fecaca;'
      : 'background-color: #f0fdf4; border-color: #bbf7d0;'">
      <div v-if="result > 0" class="flex items-start gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" class="shrink-0 mt-0.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <p class="text-sm font-medium" style="color: #991b1b;">该密码已在数据泄露中发现</p>
          <p class="text-sm mt-1" style="color: #991b1b;">出现次数: <strong>{{ result.toLocaleString() }}</strong> 次</p>
          <p class="text-xs mt-2" style="color: #b91c1c;">建议立即更换此密码，不要在任何服务中使用已被泄露的密码。</p>
        </div>
      </div>
      <div v-else class="flex items-start gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" class="shrink-0 mt-0.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <div>
          <p class="text-sm font-medium" style="color: #166534;">该密码未在已知数据泄露中发现</p>
          <p class="text-xs mt-2" style="color: #15803d;">虽然该密码目前安全，但仍建议使用强密码并定期更换。</p>
        </div>
      </div>
    </div>

    <!-- 安全说明 -->
    <div class="rounded-lg border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
      <h3 class="text-sm font-medium mb-2" style="color: var(--color-text);">安全说明</h3>
      <ul class="text-xs space-y-1.5" style="color: var(--color-text-secondary);">
        <li>本工具使用 Have I Been Pwned (HIBP) 的 k-匿名性 API 进行检测</li>
        <li>仅发送密码 SHA-1 哈希值的前 5 个字符，您的完整密码不会离开浏览器</li>
        <li>所有哈希计算在本地完成，API 返回的前缀匹配结果也在本地进行比对</li>
        <li>检测过程不会泄露您的密码信息</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');
const result = ref<number | null>(null);

async function sha1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function checkBreach() {
  if (!password.value) return;
  error.value = '';
  result.value = null;
  loading.value = true;

  try {
    const hash = await sha1(password.value);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\n');
    let count = 0;

    for (const line of lines) {
      const [hashSuffix, occurrences] = line.trim().split(':');
      if (hashSuffix === suffix) {
        count = parseInt(occurrences, 10);
        break;
      }
    }

    result.value = count;
  } catch (e: any) {
    error.value = '检测失败: ' + e.message;
  } finally {
    loading.value = false;
  }
}
</script>
