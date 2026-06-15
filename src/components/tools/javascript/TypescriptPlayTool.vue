<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TextInput v-model="tsInput" label="TypeScript 代码" placeholder="interface User {\n  name: string;\n  age: number;\n}\n\nconst user: User = { name: '张三', age: 25 };\n\nfunction greet(name: string): string {\n  return `Hello, ${name}!`;\n}" :rows="14" show-count />

      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-xs font-medium" style="color: var(--color-text-secondary);">JavaScript 输出</label>
          <CopyButton v-if="jsOutput" :text="jsOutput" />
        </div>
        <textarea
          :value="jsOutput"
          readonly
          rows="14"
          class="w-full rounded-md border p-3 text-sm font-mono resize-y"
          style="background: var(--color-bg); color: var(--color-text); border-color: var(--color-border);"
          placeholder="编译后的 JS 代码将显示在这里..."
        ></textarea>
      </div>
    </div>

    <div class="flex items-center gap-4">
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">编译目标</label>
      <select v-model="target" class="rounded-md border px-3 py-1.5 text-sm" style="background: var(--color-bg); color: var(--color-text); border-color: var(--color-border);">
        <option value="es5">ES5</option>
        <option value="es2015">ES2015</option>
        <option value="es2020">ES2020</option>
      </select>
      <label class="flex items-center gap-1 text-sm cursor-pointer ml-4" style="color: var(--color-text);">
        <input type="checkbox" v-model="strictMode" /> 移除所有类型
      </label>
    </div>

    <div class="flex justify-end">
      <button @click="compile" :disabled="!tsInput.trim()" class="btn-primary">编译</button>
    </div>

    <ErrorAlert :message="error" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const tsInput = ref('');
const jsOutput = ref('');
const error = ref('');
const target = ref('es2015');
const strictMode = ref(true);

function compile() {
  error.value = '';
  jsOutput.value = '';
  try {
    let code = tsInput.value;

    // 1. Strip type annotations
    code = stripTypeAnnotations(code);

    // 2. Strip interfaces and type aliases
    code = stripInterfacesAndTypes(code);

    // 3. Strip generics
    code = stripGenerics(code);

    // 4. Strip enums (convert to objects)
    code = convertEnums(code);

    // 5. Strip access modifiers
    code = stripModifiers(code);

    // 6. Convert based on target
    if (target.value === 'es5') {
      code = convertToEs5(code);
    } else if (target.value === 'es2015') {
      // TS features removed, ES2015 kept as-is
    }

    // 7. Clean up blank lines
    code = code.replace(/\n{3,}/g, '\n\n').trim();

    jsOutput.value = code;
  } catch (e: any) {
    error.value = '编译失败: ' + e.message;
  }
}

function stripTypeAnnotations(code: string): string {
  // Remove :type after variable declarations
  code = code.replace(/:\s*([a-zA-Z_][\w<>\[\]\s|&,'"]*?)(?=\s*[=;,)}\]])/g, '');
  // Remove return type annotations: ): Type {
  code = code.replace(/\)\s*:\s*([a-zA-Z_][\w<>\[\]\s|&,'"]*?)(?=\s*\{)/g, ')');
  // Remove return type in arrow functions
  code = code.replace(/\)\s*:\s*\w+(\[\])?\s*=>/g, ') =>');
  // Remove type assertions: expr as Type
  code = code.replace(/\s+as\s+\w+(\[\])?/g, '');
  // Remove non-null assertions: expr!.prop
  code = code.replace(/!\./g, '.');
  code = code.replace(/!\s*\)/g, ')');
  return code;
}

function stripInterfacesAndTypes(code: string): string {
  // Remove interface blocks
  code = code.replace(/export\s+interface\s+\w+(?:\s+extends\s+[^{]+)?\s*\{[^}]*\}/g, '');
  code = code.replace(/interface\s+\w+(?:\s+extends\s+[^{]+)?\s*\{[^}]*\}/g, '');
  // Remove type aliases
  code = code.replace(/export\s+type\s+\w+(?:<[^>]+>)?\s*=\s*[^;\n]+;/g, '');
  code = code.replace(/type\s+\w+(?:<[^>]+>)?\s*=\s*[^;\n]+;/g, '');
  // Remove type imports
  code = code.replace(/import\s+type\s+\{[^}]+\}\s+from\s+['"][^'"]+['"]\s*;?/g, '');
  return code;
}

function stripGenerics(code: string): string {
  // Remove generic type parameters: function<T>, class<T>, Map<string, number>
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 10) {
    changed = false;
    iterations++;
    // Match <...> where content looks like a type (contains:, |, extends, uppercase names)
    const re = /<(?:[A-Z]\w*(?:\s+extends\s+\w+(?:\[\])?)?(?:\s*,\s*[A-Z]\w*(?:\s+extends\s+\w+(?:\[\])?)?)*|(?:string|number|boolean|any|void|null|undefined)(?:\s*\|\s*(?:string|number|boolean|any|void|null|undefined))*)>/g;
    const newCode = code.replace(re, '');
    if (newCode !== code) {
      code = newCode;
      changed = true;
    }
  }
  // Remove angle bracket type args: Array<string> -> Array
  code = code.replace(/<[A-Z]\w*(?:\[\])?(?:\s*,\s*[A-Z]\w*(?:\[\])?)*>/g, '');
  // Remove Map<string, number> style
  code = code.replace(/<\w+(?:\s*,\s*\w+)*>/g, '');
  return code;
}

function convertEnums(code: string): string {
  // const enum X { A, B }
  code = code.replace(/(?:const\s+)?enum\s+(\w+)\s*\{([^}]*)\}/g, (_, name, body) => {
    const items = body.split(',').filter((s: string) => s.trim());
    let value = 0;
    const mapping: string[] = [];
    for (const item of items) {
      const parts = item.trim().split('=');
      const key = parts[0].trim();
      if (parts.length > 1) {
        const val = parts.slice(1).join('=').trim();
        // Try to parse as number
        if (/^\d+$/.test(val)) {
          value = parseInt(val);
        }
        mapping.push('  ' + key + ': ' + val);
      } else {
        mapping.push('  ' + key + ': ' + value);
        value++;
      }
    }
    return 'const ' + name + ' = {\n' + mapping.join(',\n') + '\n};';
  });
  return code;
}

function stripModifiers(code: string): string {
  code = code.replace(/\b(public|private|protected|readonly|abstract|declare)\s+/g, '');
  return code;
}

function convertToEs5(code: string): string {
  // Arrow functions
  code = code.replace(/(\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>\s*\{/g, (_, params) => {
    return 'function(' + params.replace(/[()]/g, '') + ') {';
  });
  // Arrow expression: () => expr
  code = code.replace(/(\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>\s*([^;\n{]+?)(?=\s*[,;\n]|$)/g, (_, params, expr) => {
    const clean = params.replace(/[()]/g, '');
    return 'function(' + clean + ') { return ' + expr.trim() + '; }';
  });
  // let/const -> var
  code = code.replace(/\b(let|const)\b(?=\s+\w)/g, 'var');
  // Template literals
  code = code.replace(/`([^`]*)`/g, (_, content) => {
    const parts: string[] = [];
    let last = 0;
    const re = /\$\{([^}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      if (m.index > last) {
        parts.push(JSON.stringify(content.slice(last, m.index)));
      }
      parts.push('(' + m[1] + ')');
      last = m.index + m[0].length;
    }
    if (last < content.length) {
      parts.push(JSON.stringify(content.slice(last)));
    }
    if (parts.length === 0) return JSON.stringify(content);
    return parts.join(' + ');
  });
  return code;
}
</script>
