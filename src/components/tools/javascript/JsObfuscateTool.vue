<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入 JavaScript" placeholder="在此粘贴 JavaScript 代码..." :rows="14" show-count />

    <div class="flex justify-end">
      <button
        @click="obfuscate"
        :disabled="!input.trim()"
        class="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        混淆
      </button>
    </div>

    <div v-if="output" class="rounded-md border p-3 flex items-center gap-3" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <span class="text-sm" style="color: var(--color-text-secondary);">
        原始大小: {{ input.length }} 字符 → 混淆后: {{ output.length }} 字符
      </span>
    </div>

    <TextOutput v-model="output" label="混淆结果" :rows="14" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');

function obfuscate() {
  try {
    let code = input.value;

    // Collect variable names (var, let, const declarations)
    const varRegex = /(?:var|let|const)\s+([a-zA-Z_$][\w$]*)/g;
    const varNames: Set<string> = new Set();
    let match: RegExpExecArray | null;
    while ((match = varRegex.exec(code)) !== null) {
      varNames.add(match[1]);
    }

    // Collect function parameter names
    const funcRegex = /function\s*\(([^)]*)\)|\(([^)]*)\)\s*=>/g;
    while ((match = funcRegex.exec(code)) !== null) {
      const params = (match[1] || match[2] || '').split(',').map(p => p.trim()).filter(Boolean);
      params.forEach(p => varNames.add(p));
    }

    // Collect function names
    const funcNameRegex = /function\s+([a-zA-Z_$][\w$]*)/g;
    while ((match = funcNameRegex.exec(code)) !== null) {
      varNames.add(match[1]);
    }

    // Remove reserved words
    const reserved = new Set([
      'break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete',
      'do', 'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof',
      'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
      'void', 'while', 'with', 'class', 'const', 'enum', 'export', 'extends',
      'import', 'super', 'let', 'static', 'yield', 'await', 'async', 'of',
      'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
      'console', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean',
      'Date', 'RegExp', 'Error', 'Map', 'Set', 'Promise', 'Symbol',
      'window', 'document', 'globalThis',
    ]);

    const namesToRename = Array.from(varNames).filter(n => !reserved.has(n));

    // Generate short replacement names
    const replacements: Record<string, string> = {};
    namesToRename.forEach((name, i) => {
      replacements[name] = '_$' + i.toString(36);
    });

    // Sort by length descending to avoid partial replacements
    const sortedNames = Object.keys(replacements).sort((a, b) => b.length - a.length);

    // Replace variable names (using word boundary)
    sortedNames.forEach(name => {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<![\\w$])${escaped}(?![\\w$])`, 'g');
      code = code.replace(regex, replacements[name]);
    });

    // Encode string literals to hex
    code = code.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, content: string) => {
      const hex = content.split('').map(c => '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      return `'${hex}'`;
    });

    // Also encode double-quoted strings
    code = code.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (_, content: string) => {
      const hex = content.split('').map(c => '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      return `"${hex}"`;
    });

    output.value = code;
  } catch (e: any) {
    output.value = '';
  }
}
</script>
