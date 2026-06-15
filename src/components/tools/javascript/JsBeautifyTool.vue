<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入 JavaScript" placeholder="在此粘贴需要美化的 JavaScript 代码..." :rows="12" show-count />

    <div class="flex justify-end">
      <button
        @click="format"
        :disabled="!input.trim()"
        class="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        美化
      </button>
    </div>

    <ErrorAlert :message="error" />

    <TextOutput v-model="output" label="美化结果" :rows="12" />

    <div v-if="output && input" class="text-xs" style="color: var(--color-text-muted);">
      原始大小: {{ inputSize }} 字符 → 美化后: {{ outputSize }} 字符
      ({{ sizeDiff }})
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const input = ref('');
const output = ref('');
const error = ref('');

const inputSize = computed(() => input.value.length);
const outputSize = computed(() => output.value.length);

const sizeDiff = computed(() => {
  if (!output.value) return '';
  const diff = outputSize.value - inputSize.value;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff} 字符`;
});

function format() {
  error.value = '';
  try {
    let code = input.value;
    const indentSize = 2;
    let indentLevel = 0;
    let result = '';
    let i = 0;

    while (i < code.length) {
      const char = code[i];

      // Skip existing whitespace at line start after newlines
      if (result.endsWith('\n')) {
        while (i < code.length && (code[i] === ' ' || code[i] === '\t')) {
          i++;
        }
        continue;
      }

      // Handle strings
      if (char === '"' || char === "'" || char === '`') {
        const quote = char;
        let str = quote;
        i++;
        while (i < code.length && code[i] !== quote) {
          if (code[i] === '\\') {
            str += code[i];
            i++;
            if (i < code.length) str += code[i];
          } else {
            str += code[i];
          }
          i++;
        }
        if (i < code.length) str += code[i];
        result += str;
        i++;
        continue;
      }

      // Handle regex
      if (char === '/' && result.length > 0) {
        const prev = result[result.length - 1];
        if (prev === '=' || prev === '(' || prev === '[' || prev === '!' || prev === '&' || prev === '|' || prev === '{' || prev === ';' || prev === ':' || prev === ',') {
          let regex = '/';
          i++;
          while (i < code.length && code[i] !== '/') {
            if (code[i] === '\\') {
              regex += code[i];
              i++;
              if (i < code.length) regex += code[i];
            } else {
              regex += code[i];
            }
            i++;
          }
          if (i < code.length) {
            regex += code[i];
            i++;
            // flags
            while (i < code.length && /[gimsuy]/.test(code[i])) {
              regex += code[i];
              i++;
            }
          }
          result += regex;
          continue;
        }
      }

      // Handle single-line comments
      if (char === '/' && code[i + 1] === '/') {
        while (i < code.length && code[i] !== '\n') {
          result += code[i];
          i++;
        }
        continue;
      }

      // Handle multi-line comments
      if (char === '/' && code[i + 1] === '*') {
        while (i < code.length) {
          result += code[i];
          if (code[i] === '*' && code[i + 1] === '/') {
            result += code[i + 1];
            i += 2;
            break;
          }
          i++;
        }
        continue;
      }

      // Opening braces/brackets
      if (char === '{' || char === '[' || char === '(') {
        result += char;
        indentLevel++;
        result += '\n' + ' '.repeat(indentLevel * indentSize);
        i++;
        continue;
      }

      // Closing braces/brackets
      if (char === '}' || char === ']' || char === ')') {
        indentLevel = Math.max(0, indentLevel - 1);
        result = result.trimEnd();
        result += '\n' + ' '.repeat(indentLevel * indentSize) + char;
        i++;
        continue;
      }

      // Semicolons
      if (char === ';') {
        result += char;
        result += '\n' + ' '.repeat(indentLevel * indentSize);
        i++;
        continue;
      }

      // Commas - add space after
      if (char === ',') {
        result += char + ' ';
        i++;
        continue;
      }

      // Colons - add space after
      if (char === ':') {
        result += ' ' + char + ' ';
        i++;
        continue;
      }

      // Operators - add spaces around them (the "beautify" difference from JsFormatTool)
      if ('=+-*/%&|<>!^'.includes(char)) {
        // Check for multi-char operators
        let op = char;
        const nextCh = code[i + 1];
        if ((char === '=' && nextCh === '=') ||
            (char === '!' && nextCh === '=') ||
            (char === '>' && nextCh === '=') ||
            (char === '<' && nextCh === '=') ||
            (char === '&' && nextCh === '&') ||
            (char === '|' && nextCh === '|') ||
            (char === '+' && nextCh === '+') ||
            (char === '-' && nextCh === '-') ||
            (char === '+' && nextCh === '=') ||
            (char === '-' && nextCh === '=') ||
            (char === '*' && nextCh === '=') ||
            (char === '/' && nextCh === '=') ||
            (char === '>' && nextCh === '>') ||
            (char === '<' && nextCh === '<') ||
            (char === '*' && nextCh === '*') ||
            (char === '=' && nextCh === '>')) {
          op += nextCh;
        }

        result += ' ' + op + ' ';
        i += op.length;
        continue;
      }

      result += char;
      i++;
    }

    // Clean up: remove multiple blank lines, trailing whitespace
    result = result.replace(/\n{3,}/g, '\n\n');
    // Remove extra spaces around operators within strings is not a concern
    // Collapse multiple spaces
    result = result.replace(/ {3,}/g, '  ');
    result = result.split('\n').map(line => line.trimEnd()).join('\n');
    output.value = result.trim();
  } catch (e: any) {
    error.value = '美化失败: ' + e.message;
  }
}
</script>
