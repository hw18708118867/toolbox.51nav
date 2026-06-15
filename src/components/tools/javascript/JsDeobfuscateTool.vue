<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入混淆的 JavaScript 代码" placeholder="粘贴混淆后的 JS 代码..." :rows="12" show-count />

    <div class="flex flex-wrap items-center gap-3">
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">反混淆选项</label>
      <label class="flex items-center gap-1 text-sm cursor-pointer" style="color: var(--color-text);">
        <input type="checkbox" v-model="options.format" /> 美化代码
      </label>
      <label class="flex items-center gap-1 text-sm cursor-pointer" style="color: var(--color-text);">
        <input type="checkbox" v-model="options.unescape" /> 反转义序列
      </label>
      <label class="flex items-center gap-1 text-sm cursor-pointer" style="color: var(--color-text);">
        <input type="checkbox" v-model="options.unwrapEval" /> 展开 eval 链
      </label>
      <label class="flex items-center gap-1 text-sm cursor-pointer" style="color: var(--color-text);">
        <input type="checkbox" v-model="options.resolveStrings" /> 解析字符串数组引用
      </label>
    </div>

    <div class="flex justify-end gap-2">
      <CopyButton v-if="output" :text="output" />
      <button @click="deobfuscate" :disabled="!input.trim()" class="btn-primary">反混淆</button>
    </div>

    <ErrorAlert :message="error" />
    <TextOutput v-model="output" label="反混淆结果" :rows="14" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const input = ref('');
const output = ref('');
const error = ref('');

const options = reactive({
  format: true,
  unescape: true,
  unwrapEval: true,
  resolveStrings: true,
});

function deobfuscate() {
  error.value = '';
  output.value = '';
  try {
    let code = input.value;

    // 1. Unescape hex/unicode sequences
    if (options.unescape) {
      code = unescapeSequences(code);
    }

    // 2. Resolve string array lookups
    if (options.resolveStrings) {
      code = resolveStringArrays(code);
    }

    // 3. Unwrap simple eval chains
    if (options.unwrapEval) {
      code = unwrapEvalChains(code);
    }

    // 4. Format/beautify
    if (options.format) {
      code = formatJs(code);
    }

    output.value = code;
  } catch (e: any) {
    error.value = '反混淆失败: ' + e.message;
  }
}

function unescapeSequences(code: string): string {
  // Hex escape: \x48 -> char
  code = code.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  // Unicode escape: H -> char
  code = code.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  // Octal escape: \110 -> char (in strings)
  code = code.replace(/\\([0-7]{3})/g, (_, oct) => {
    return String.fromCharCode(parseInt(oct, 8));
  });

  // Unicode code point: \u{...}
  code = code.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => {
    return String.fromCodePoint(parseInt(hex, 16));
  });

  // Handle \x48\x65 style sequences
  // Already handled above

  return code;
}

function resolveStringArrays(code: string): string {
  // Detect common pattern: var _0x = ["hello", "world"]; _0x[0]
  const arrayDeclRe = /(?:var|const|let)\s+(_0x[a-f0-9]*|_[a-f0-9]+)\s*=\s*\[([^\]]*)\];/gi;
  const stringTables: Record<string, string[]> = {};

  let m: RegExpExecArray | null;
  while ((m = arrayDeclRe.exec(code)) !== null) {
    const varName = m[1];
    const itemsStr = m[2];
    // Parse items (strings only)
    const items: string[] = [];
    const strRe = /'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"/g;
    let sm: RegExpExecArray | null;
    while ((sm = strRe.exec(itemsStr)) !== null) {
      items.push(sm[1] || sm[2] || '');
    }
    if (items.length > 0) {
      stringTables[varName] = items;
    }
  }

  // Replace array accesses with actual strings
  for (const [varName, items] of Object.entries(stringTables)) {
    // Pattern: varName[index]
    const accessRe = new RegExp(`${escapeRegExp(varName)}\\[(\\d+)\\]`, 'g');
    code = code.replace(accessRe, (_, idx) => {
      const i = parseInt(idx);
      if (i >= 0 && i < items.length) {
        return JSON.stringify(items[i]);
      }
      return _;
    });
  }

  return code;
}

function unwrapEvalChains(code: string): string {
  // Detect and simplify eval("code") -> code
  // Only handle direct eval of strings
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 20) {
    changed = false;
    iterations++;

    // eval("...") -> ...
    const evalRe = /eval\("((?:[^"\\]|\\.)*)"\)/g;
    const newCode = code.replace(evalRe, (_, content) => {
      changed = true;
      // Unescape the content
      try {
        return JSON.parse('"' + content + '"');
      } catch {
        return content;
      }
    });
    if (newCode !== code) {
      code = newCode;
      continue;
    }

    // eval('...') -> ...
    const evalRe2 = /eval\('((?:[^'\\]|\\.)*)'\)/g;
    const newCode2 = code.replace(evalRe2, (_, content) => {
      changed = true;
      try {
        return JSON.parse('"' + content.replace(/\\'/g, "'") + '"');
      } catch {
        return content;
      }
    });
    if (newCode2 !== code) {
      code = newCode2;
    }
  }

  return code;
}

function formatJs(code: string): string {
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

    // Colons
    if (char === ':') {
      result += char + ' ';
      i++;
      continue;
    }

    result += char;
    i++;
  }

  result = result.replace(/\n{3,}/g, '\n\n');
  result = result.split('\n').map(line => line.trimEnd()).join('\n');
  return result.trim();
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
</script>
