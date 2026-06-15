<template>
  <div class="space-y-4">
    <TextInput v-model="code" label="JavaScript 代码" placeholder="console.log('Hello, World!');" :rows="14" show-count />

    <div class="flex justify-end gap-2">
      <button
        @click="clearOutput"
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors border"
        style="background-color: var(--color-bg-secondary); color: var(--color-text); border-color: var(--color-border);"
      >
        清空输出
      </button>
      <button
        @click="runCode"
        :disabled="!code.trim() || running"
        class="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        {{ running ? '运行中...' : '运行' }}
      </button>
    </div>

    <ErrorAlert :message="errorMessage" />

    <div v-if="executionTime !== null" class="text-xs" style="color: var(--color-text-muted);">
      执行时间: {{ executionTime }}ms
    </div>

    <div>
      <div class="flex items-center justify-between mb-1.5">
        <label class="text-xs font-medium" style="color: var(--color-text-secondary);">输出结果</label>
      </div>
      <div
        class="w-full rounded-md border px-3 py-2 text-sm font-mono min-h-[200px] max-h-[400px] overflow-y-auto whitespace-pre-wrap"
        style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text);"
      >{{ outputLines.join('\n') || '运行代码以查看输出...' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const code = ref('');
const outputLines = ref<string[]>([]);
const errorMessage = ref('');
const executionTime = ref<number | null>(null);
const running = ref(false);

function clearOutput() {
  outputLines.value = [];
  errorMessage.value = '';
  executionTime.value = null;
}

function runCode() {
  errorMessage.value = '';
  outputLines.value = [];
  executionTime.value = null;

  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  try {
    // Override console methods to capture output
    console.log = (...args: any[]) => {
      outputLines.value.push(args.map(a => formatArg(a)).join(' '));
    };
    console.warn = (...args: any[]) => {
      outputLines.value.push('[警告] ' + args.map(a => formatArg(a)).join(' '));
    };
    console.error = (...args: any[]) => {
      outputLines.value.push('[错误] ' + args.map(a => formatArg(a)).join(' '));
    };

    const startTime = performance.now();
    running.value = true;

    // Execute in try-catch
    const userCode = code.value;
    const result = new Function(userCode)();

    const endTime = performance.now();
    executionTime.value = Math.round((endTime - startTime) * 100) / 100;

    // Show return value if not undefined
    if (result !== undefined) {
      outputLines.value.push('返回值: ' + formatArg(result));
    }
  } catch (e: any) {
    errorMessage.value = e.message || '代码执行出错';
    const endTime = performance.now();
    executionTime.value = Math.round(endTime * 100) / 100;
  } finally {
    running.value = false;
    // Restore console methods
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  }
}

function formatArg(arg: any): string {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}
</script>
