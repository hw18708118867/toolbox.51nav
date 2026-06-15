<template>
  <div class="space-y-4">
    <div class="space-y-3">
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-medium" style="color: var(--color-text-secondary);">长度: {{ length }}</label>
        </div>
        <input
          v-model.number="length"
          type="range"
          :min="4"
          :max="128"
          class="w-full"
        />
      </div>

      <div class="grid grid-cols-2 gap-2">
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
          <input v-model="useUppercase" type="checkbox" class="rounded" />
          大写字母 (A-Z)
        </label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
          <input v-model="useLowercase" type="checkbox" class="rounded" />
          小写字母 (a-z)
        </label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
          <input v-model="useNumbers" type="checkbox" class="rounded" />
          数字 (0-9)
        </label>
        <label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
          <input v-model="useSymbols" type="checkbox" class="rounded" />
          符号 (!@#$%^&*)
        </label>
      </div>
    </div>

    <ErrorAlert :message="error" />

    <div class="flex justify-start">
      <button
        @click="generateStr"
        class="btn-primary"
      >
        生成
      </button>
    </div>

    <div v-if="result" class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <div class="flex items-center justify-between">
        <span class="text-sm font-mono break-all" style="color: var(--color-text);">{{ result }}</span>
        <CopyButton :text="result" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const length = ref(16);
const useUppercase = ref(true);
const useLowercase = ref(true);
const useNumbers = ref(true);
const useSymbols = ref(false);
const result = ref('');
const error = ref('');

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

function generateStr() {
  error.value = '';
  let charset = '';
  if (useUppercase.value) charset += UPPER;
  if (useLowercase.value) charset += LOWER;
  if (useNumbers.value) charset += DIGITS;
  if (useSymbols.value) charset += SYMBOLS;

  if (!charset) {
    error.value = '请至少选择一种字符集';
    return;
  }

  const bytes = new Uint8Array(length.value);
  crypto.getRandomValues(bytes);
  result.value = Array.from(bytes, b => charset[b % charset.length]).join('');
}
</script>
