<template>
  <div class="space-y-4">
    <div class="space-y-3">
      <!-- 长度滑块 -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-medium" style="color: var(--color-text-secondary);">密码长度</label>
          <span class="text-xs font-mono" style="color: var(--color-text-muted);">{{ length }}</span>
        </div>
        <input
          v-model.number="length"
          type="range"
          :min="8"
          :max="128"
          class="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style="background-color: var(--color-bg-tertiary); accent-color: var(--color-primary);"
        />
      </div>

      <!-- 字符集选项 -->
      <div class="grid grid-cols-2 gap-2">
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
          <input v-model="uppercase" type="checkbox" class="rounded" style="accent-color: var(--color-primary);" />
          大写字母 (A-Z)
        </label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
          <input v-model="lowercase" type="checkbox" class="rounded" style="accent-color: var(--color-primary);" />
          小写字母 (a-z)
        </label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
          <input v-model="numbers" type="checkbox" class="rounded" style="accent-color: var(--color-primary);" />
          数字 (0-9)
        </label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
          <input v-model="symbols" type="checkbox" class="rounded" style="accent-color: var(--color-primary);" />
          符号 (!@#$...)
        </label>
      </div>

      <!-- 排除歧义字符 -->
      <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
        <input v-model="excludeAmbiguous" type="checkbox" class="rounded" style="accent-color: var(--color-primary);" />
        排除歧义字符 (0Oo1lI)
      </label>
    </div>

    <!-- 生成数量和按钮 -->
    <div class="flex items-center gap-4">
      <div>
        <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">生成数量</label>
        <select v-model.number="count" class="rounded-md border px-3 py-2 text-sm" >
          <option :value="1">1 个</option>
          <option :value="5">5 个</option>
        </select>
      </div>
      <div class="pt-4">
        <button @click="generate" class="btn-primary">
          生成密码
        </button>
      </div>
    </div>

    <ErrorAlert :message="error" />

    <!-- 生成的密码列表 -->
    <div v-if="passwords.length > 0" class="space-y-3">
      <div v-for="(pwd, idx) in passwords" :key="idx" class="space-y-1">
        <div class="flex items-center gap-2">
          <div
            class="flex-1 rounded-md border px-3 py-2 text-sm font-mono break-all"
            style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text);"
          >{{ pwd.value }}</div>
          <CopyButton :text="pwd.value" />
        </div>
        <!-- 强度指示条 -->
        <div class="flex items-center gap-2">
          <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background-color: var(--color-bg-tertiary);">
            <div
              class="h-full rounded-full transition-all duration-300"
              :style="`width: ${pwd.score}%; background-color: ${getStrengthColor(pwd.score)};`"
            />
          </div>
          <span class="text-xs" :style="`color: ${getStrengthColor(pwd.score)};`">{{ getStrengthLabel(pwd.score) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const length = ref(16);
const uppercase = ref(true);
const lowercase = ref(true);
const numbers = ref(true);
const symbols = ref(true);
const excludeAmbiguous = ref(false);
const count = ref(1);
const error = ref('');

interface PasswordResult {
  value: string;
  score: number;
}

const passwords = ref<PasswordResult[]>([]);

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = '0Oo1lI';

function getCharset(): string {
  let charset = '';
  if (uppercase.value) charset += UPPER;
  if (lowercase.value) charset += LOWER;
  if (numbers.value) charset += DIGITS;
  if (symbols.value) charset += SYMBOLS;
  if (excludeAmbiguous.value) {
    charset = charset.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
  }
  return charset;
}

function generateSecurePassword(len: number, charset: string): string {
  const array = new Uint32Array(len);
  crypto.getRandomValues(array);
  return Array.from(array, v => charset[v % charset.length]).join('');
}

function calcScore(pwd: string): number {
  let score = 0;
  if (/[a-z]/.test(pwd)) score += 20;
  if (/[A-Z]/.test(pwd)) score += 20;
  if (/[0-9]/.test(pwd)) score += 20;
  if (/[^a-zA-Z0-9]/.test(pwd)) score += 20;
  if (pwd.length >= 12) score += 10;
  if (pwd.length >= 16) score += 10;
  return Math.min(100, score);
}

function getStrengthColor(score: number): string {
  if (score < 40) return '#ef4444';
  if (score < 70) return '#f59e0b';
  return '#22c55e';
}

function getStrengthLabel(score: number): string {
  if (score < 40) return '弱';
  if (score < 70) return '中等';
  return '强';
}

function generate() {
  error.value = '';
  const charset = getCharset();
  if (!charset) {
    error.value = '请至少选择一种字符集';
    return;
  }
  const result: PasswordResult[] = [];
  for (let i = 0; i < count.value; i++) {
    const pwd = generateSecurePassword(length.value, charset);
    result.push({ value: pwd, score: calcScore(pwd) });
  }
  passwords.value = result;
}
</script>
