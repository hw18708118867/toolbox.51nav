<template>
  <div class="space-y-4">
    <div>
      <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">数学表达式</label>
      <input
        v-model="expression"
        type="text"
        placeholder="例如: sqrt(16) + pow(2, 3) * 5"
        class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none "
        
        @keyup.enter="calculate"
      />
      <p class="text-xs mt-1" style="color: var(--color-text-muted);">
        支持的运算符: +, -, *, /, %, ** | 函数: sqrt, sin, cos, abs, round, ceil, floor, pow
      </p>
    </div>

    <div class="flex justify-start">
      <button
        @click="calculate"
        class="btn-primary"
      >
        计算
      </button>
    </div>

    <ErrorAlert :message="error" />

    <div v-if="result !== null" class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs mb-1" style="color: var(--color-text-secondary);">结果</div>
          <code class="text-2xl font-mono font-bold" style="color: var(--color-primary);">{{ result }}</code>
        </div>
        <CopyButton :text="String(result)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const expression = ref('');
const result = ref<number | null>(null);
const error = ref('');

function calculate() {
  error.value = '';
  result.value = null;

  if (!expression.value.trim()) return;

  try {
    const sanitized = expression.value
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/abs\(/g, 'Math.abs(')
      .replace(/round\(/g, 'Math.round(')
      .replace(/ceil\(/g, 'Math.ceil(')
      .replace(/floor\(/g, 'Math.floor(')
      .replace(/pow\(/g, 'Math.pow(')
      .replace(/log\(/g, 'Math.log(')
      .replace(/exp\(/g, 'Math.exp(')
      .replace(/PI/g, 'Math.PI')
      .replace(/pi/g, 'Math.PI');

    // Validate only allowed characters remain
    if (/[^0-9+\-*/().,%\s]/.test(sanitized.replace(/Math\.\w+/g, ''))) {
      error.value = '表达式包含不支持的函数或字符';
      return;
    }

    const fn = new Function('Math', `"use strict"; return (${sanitized});`);
    const val = fn(Math);
    result.value = typeof val === 'number' && isFinite(val) ? val : NaN;
    if (isNaN(result.value)) {
      error.value = '计算结果无效';
      result.value = null;
    }
  } catch (e: any) {
    error.value = '计算表达式失败: ' + e.message;
  }
}
</script>
