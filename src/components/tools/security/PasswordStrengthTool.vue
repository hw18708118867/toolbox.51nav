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

    <!-- 强度条和分数 -->
    <div v-if="password" class="space-y-2">
      <div class="flex items-center gap-3">
        <div class="flex-1 h-2.5 rounded-full overflow-hidden" style="background-color: var(--color-bg-tertiary);">
          <div
            class="h-full rounded-full transition-all duration-300"
            :style="`width: ${score}%; background-color: ${strengthColor};`"
          />
        </div>
        <span class="text-sm font-mono font-medium" :style="`color: ${strengthColor};`">{{ score }}/100</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium" :style="`color: ${strengthColor};`">{{ strengthLabel }}</span>
        <span class="text-xs" style="color: var(--color-text-muted);">预计破解时间: {{ crackTime }}</span>
      </div>
    </div>

    <!-- 检查清单 -->
    <div v-if="password" class="space-y-1.5">
      <div class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">密码要求检查</div>
      <div v-for="check in checks" :key="check.label" class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
        <span>{{ check.passed ? '✅' : '❌' }}</span>
        <span>{{ check.label }}</span>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!password" class="text-center py-6">
      <p class="text-sm" style="color: var(--color-text-muted);">输入密码后将实时分析其强度</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const password = ref('');
const showPassword = ref(false);

const checks = computed(() => [
  { label: '包含大写字母', passed: /[A-Z]/.test(password.value) },
  { label: '包含小写字母', passed: /[a-z]/.test(password.value) },
  { label: '包含数字', passed: /[0-9]/.test(password.value) },
  { label: '包含特殊符号', passed: /[^a-zA-Z0-9]/.test(password.value) },
  { label: '长度至少 8 位', passed: password.value.length >= 8 },
  { label: '长度至少 12 位', passed: password.value.length >= 12 },
]);

const score = computed(() => {
  if (!password.value) return 0;
  let s = 0;

  // Length scoring
  const len = password.value.length;
  if (len >= 1) s += 5;
  if (len >= 4) s += 5;
  if (len >= 8) s += 10;
  if (len >= 12) s += 10;
  if (len >= 16) s += 10;
  if (len >= 20) s += 5;

  // Character variety scoring
  if (/[a-z]/.test(password.value)) s += 10;
  if (/[A-Z]/.test(password.value)) s += 10;
  if (/[0-9]/.test(password.value)) s += 10;
  if (/[^a-zA-Z0-9]/.test(password.value)) s += 15;

  // Entropy bonus for variety
  const varietyCount = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(r => r.test(password.value)).length;
  if (varietyCount >= 3) s += 5;
  if (varietyCount >= 4) s += 5;

  return Math.min(100, s);
});

const strengthColor = computed(() => {
  if (score.value < 30) return '#ef4444';
  if (score.value < 60) return '#f59e0b';
  if (score.value < 80) return '#3b82f6';
  return '#22c55e';
});

const strengthLabel = computed(() => {
  if (score.value < 30) return '非常弱';
  if (score.value < 60) return '较弱';
  if (score.value < 80) return '中等';
  return '强';
});

const crackTime = computed(() => {
  if (!password.value) return '-';
  const charsetSize = getCharsetSize(password.value);
  const combinations = Math.pow(charsetSize, password.value.length);
  // Assume 10 billion guesses per second
  const seconds = combinations / 10e9;

  if (seconds < 1) return '瞬间';
  if (seconds < 60) return `${Math.ceil(seconds)} 秒`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} 分钟`;
  if (seconds < 86400) return `${Math.ceil(seconds / 3600)} 小时`;
  if (seconds < 86400 * 365) return `${Math.ceil(seconds / 86400)} 天`;
  if (seconds < 86400 * 365 * 100) return `${Math.ceil(seconds / (86400 * 365))} 年`;
  if (seconds < 86400 * 365 * 1e6) return `${Math.ceil(seconds / (86400 * 365 * 1000))} 千年`;
  if (seconds < 86400 * 365 * 1e9) return `${Math.ceil(seconds / (86400 * 365 * 1e6))} 百万年`;
  return '数亿年以上';
});

function getCharsetSize(pwd: string): number {
  let size = 0;
  if (/[a-z]/.test(pwd)) size += 26;
  if (/[A-Z]/.test(pwd)) size += 26;
  if (/[0-9]/.test(pwd)) size += 10;
  if (/[^a-zA-Z0-9]/.test(pwd)) size += 33;
  return size || 1;
}
</script>
