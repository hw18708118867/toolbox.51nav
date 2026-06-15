<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入 JavaScript" placeholder="在此粘贴需要格式化的 JavaScript 代码..." :rows="12" show-count />

    <div class="flex justify-end">
      <button
        @click="format"
        :disabled="!input.trim()"
        class="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        格式化
      </button>
    </div>

    <TextOutput v-model="output" label="格式化结果" :rows="12" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');

function format() {
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
        // Don't add newline if followed by whitespace and then another statement
        result += '\n' + ' '.repeat(indentLevel * indentSize);
        i++;
        continue;
      }

      // Commas
      if (char === ',') {
        result += char + ' ';
        i++;
        continue;
      }

      // Colons (object literals, case, ternary)
      if (char === ':') {
        result += char + ' ';
        i++;
        continue;
      }

      result += char;
      i++;
    }

    // Clean up: remove multiple blank lines
    result = result.replace(/\n{3,}/g, '\n\n');
    // Trim whitespace from each line
    result = result.split('\n').map(line => line.trimEnd()).join('\n');
    output.value = result.trim();
  } catch (e: any) {
    output.value = '';
  }
}
</script>
