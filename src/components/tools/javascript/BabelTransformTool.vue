<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入 JavaScript 代码" placeholder="const greet = (name) => `Hello, ${name}!`;" :rows="10" show-count />

    <div class="flex items-center gap-4">
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">转换预设</label>
      <select v-model="preset" class="rounded-md border px-3 py-1.5 text-sm" style="background: var(--color-bg); color: var(--color-text); border-color: var(--color-border);">
        <option value="es2015">ES2015 → ES5</option>
        <option value="jsx">JSX → JS</option>
        <option value="typescript">TypeScript → JS</option>
        <option value="es2020">ES2020+ → ES5</option>
      </select>
    </div>

    <div class="flex justify-end gap-2">
      <CopyButton v-if="output" :text="output" />
      <button @click="transform" :disabled="!input.trim()" class="btn-primary">转换</button>
    </div>

    <ErrorAlert :message="error" />
    <TextOutput v-model="output" label="转换结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const input = ref('');
const output = ref('');
const error = ref('');
const preset = ref('es2015');

function transform() {
  error.value = '';
  output.value = '';
  try {
    let code = input.value;
    const selected = preset.value;

    if (selected === 'es2015' || selected === 'es2020') {
      code = transformLetConstToVar(code);
      code = transformArrowFunctions(code);
      code = transformTemplateLiterals(code);
      code = transformClasses(code);
      code = transformDestructuring(code);
      code = transformDefaultParams(code);
      code = transformSpread(code);
      code = transformForOf(code);
      code = transformShorthandMethods(code);
    }

    if (selected === 'es2020') {
      code = transformOptionalChaining(code);
      code = transformNullishCoalescing(code);
    }

    if (selected === 'jsx') {
      code = transformJsx(code);
    }

    if (selected === 'typescript') {
      code = transformTypeScript(code);
      code = transformLetConstToVar(code);
      code = transformArrowFunctions(code);
      code = transformTemplateLiterals(code);
    }

    output.value = code;
  } catch (e: any) {
    error.value = '转换失败: ' + e.message;
  }
}

// ES6+ transforms

function transformLetConstToVar(code: string): string {
  return code.replace(/\b(const|let)\b(?=\s+\w)/g, 'var');
}

function transformArrowFunctions(code: string): string {
  // Handle single-expression arrow: (x) => expr
  const singleExprRe = /(\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>\s*({[^}]*}|\[[^\]]*\]|`[^`]*`|'[^']*'|"[^"]*"|[^;,{}]+?)(?=\s*[,;)}\n]|$)/g;
  // Simpler approach: find arrow functions
  let result = '';
  let i = 0;
  while (i < code.length) {
    // Look for =>
    const arrowIdx = code.indexOf('=>', i);
    if (arrowIdx === -1) {
      result += code.slice(i);
      break;
    }
    // Find the start of the arrow function's params
    let paramStart = arrowIdx - 1;
    while (paramStart > i && code[paramStart] !== '(' && code[paramStart] !== ',' &&
           !(code[paramStart] === '>' && code[paramStart - 1] === '=') &&
           code[paramStart] !== ' ' && code[paramStart] !== '\t' && code[paramStart] !== '\n') {
      paramStart--;
    }
    // Find the actual param start (opening paren or single param)
    if (code[paramStart] === ')') {
      let depth = 1;
      paramStart--;
      while (paramStart >= i && depth > 0) {
        if (code[paramStart] === ')') depth++;
        else if (code[paramStart] === '(') depth--;
        paramStart--;
      }
      paramStart++;
    } else if (code[paramStart] === ' ') {
      // single param like "x =>"
      paramStart++;
    } else {
      // single param at start
    }

    const params = code.slice(paramStart, arrowIdx).trim();

    // Find the body
    let bodyStart = arrowIdx + 2;
    while (bodyStart < code.length && (code[bodyStart] === ' ' || code[bodyStart] === '\t')) bodyStart++;

    if (bodyStart >= code.length) {
      result += code.slice(i, arrowIdx + 2);
      i = arrowIdx + 2;
      continue;
    }

    // Copy everything before paramStart
    result += code.slice(i, paramStart);

    if (code[bodyStart] === '{') {
      // Block body: () => { ... }
      let depth = 1;
      let bodyEnd = bodyStart + 1;
      while (bodyEnd < code.length && depth > 0) {
        if (code[bodyEnd] === '{') depth++;
        else if (code[bodyEnd] === '}') depth--;
        bodyEnd++;
      }
      const body = code.slice(bodyStart + 1, bodyEnd - 1).trim();
      result += 'function(' + params + ') {\n' + body + '\n}';
      i = bodyEnd;
    } else {
      // Expression body: () => expr
      let bodyEnd = bodyStart;
      while (bodyEnd < code.length && code[bodyEnd] !== ',' && code[bodyEnd] !== ';' &&
             code[bodyEnd] !== '}' && code[bodyEnd] !== ')' && code[bodyEnd] !== '\n') {
        if (code[bodyEnd] === '(' || code[bodyEnd] === '[' || code[bodyEnd] === '{' || code[bodyEnd] === '`') {
          const closer = code[bodyEnd] === '(' ? ')' : code[bodyEnd] === '[' ? ']' : code[bodyEnd] === '{' ? '}' : '`';
          let d = 1;
          bodyEnd++;
          while (bodyEnd < code.length && d > 0) {
            if (code[bodyEnd] === code[bodyStart] && code[bodyStart] === '`') {
              // template literal
              if (code[bodyEnd] === '`') d--;
            } else if (code[bodyEnd] === closer && closer !== '`') d--;
            else if (code[bodyEnd] === code[bodyStart] && closer === '`') d++;
            else if (code[bodyEnd] === '(' && closer === ')') d++;
            else if (code[bodyEnd] === '[' && closer === ']') d++;
            else if (code[bodyEnd] === '{' && closer === '}') d++;
            bodyEnd++;
          }
        } else {
          bodyEnd++;
        }
      }
      const body = code.slice(bodyStart, bodyEnd).trim();
      result += 'function(' + params + ') { return ' + body + '; }';
      i = bodyEnd;
    }
  }
  return result;
}

function transformTemplateLiterals(code: string): string {
  return code.replace(/`([^`]*)`/g, (_, content) => {
    // Replace ${expr} with string concatenation
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
}

function transformClasses(code: string): string {
  // Very basic class transform
  return code.replace(/class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{([\s\S]*?)\n\}/g, (_, name, parent, body) => {
    let result = 'function ' + name + '() {\n';
    if (parent) {
      result += '  ' + parent + '.call(this);\n';
    }
    // Find constructor
    const ctorMatch = body.match(/constructor\s*\(([^)]*)\)\s*\{([\s\S]*?)\n\s*\}/);
    if (ctorMatch) {
      result += '  ' + ctorMatch[2].trim() + '\n';
    }
    result += '}\n';
    if (parent) {
      result += name + '.prototype = Object.create(' + parent + '.prototype);\n';
      result += name + '.prototype.constructor = ' + name + ';\n';
    }
    // Methods
    const methodRe = /(?:^|\n)\s*(\w+)\s*\(([^)]*)\)\s*\{/g;
    let mm: RegExpExecArray | null;
    while ((mm = methodRe.exec(body)) !== null) {
      if (mm[1] !== 'constructor') {
        result += name + '.prototype.' + mm[1] + ' = function(' + mm[2] + ') {\n';
        // Find matching closing brace
        const start = mm.index + mm[0].length;
        let depth = 1;
        let j = start;
        while (j < body.length && depth > 0) {
          if (body[j] === '{') depth++;
          else if (body[j] === '}') depth--;
          j++;
        }
        const methodBody = body.slice(start, j - 1).trim();
        result += methodBody + '\n};\n';
      }
    }
    return result;
  });
}

function transformDestructuring(code: string): string {
  // Replace const { a, b } = obj;
  code = code.replace(/(?:var|const|let)\s+\{\s*([^}]+)\}\s*=\s*([^;]+);/g, (_, props, source) => {
    const names = props.split(',').map((p: string) => p.trim().split(':')[0].trim());
    return names.map((n: string) => 'var ' + n + ' = ' + source.trim() + '.' + n + ';').join('\n');
  });
  // Replace const [a, b] = arr;
  code = code.replace(/(?:var|const|let)\s+\[\s*([^\]]+)\]\s*=\s*([^;]+);/g, (_, elems, source) => {
    const names = elems.split(',').map((e: string) => e.trim());
    return names.map((n: string, idx: number) => 'var ' + n + ' = ' + source.trim() + '[' + idx + '];').join('\n');
  });
  return code;
}

function transformDefaultParams(code: string): string {
  // function foo(a = 1) { } -> check inside
  return code.replace(/function\s+(\w+)\s*\(([^)]*)\)/g, (_, name, params) => {
    const parts = params.split(',').map((p: string) => p.trim());
    const hasDefault = parts.some(p => p.includes('='));
    if (!hasDefault) return 'function ' + name + '(' + params + ')';
    const cleanParams = parts.map(p => p.split('=')[0].trim()).join(', ');
    let result = 'function ' + name + '(' + cleanParams + ') {\n';
    for (const part of parts) {
      if (part.includes('=')) {
        const [paramName, defVal] = part.split('=').map((s: string) => s.trim());
        result += '  if (' + paramName + ' === undefined) ' + paramName + ' = ' + defVal + ';\n';
      }
    }
    return result;
  });
}

function transformSpread(code: string): string {
  // [...arr] -> arr.slice()
  code = code.replace(/\[\.\.\.(\w+)\]/g, '($1).slice()');
  // Math.max(...arr) -> Math.max.apply(null, arr)
  code = code.replace(/(\w+(?:\.\w+)?)\(\.\.\.(\w+)\)/g, '$1.apply(null, $2)');
  // { ...obj } -> Object.assign({}, obj)
  code = code.replace(/\{\s*\.\.\.(\w+)\s*\}/g, 'Object.assign({}, $1)');
  return code;
}

function transformForOf(code: string): string {
  // for (const x of arr) -> for (var _i = 0; _i < arr.length; _i++) { const x = arr[_i]; }
  return code.replace(/for\s*\((?:var|const|let)\s+(\w+)\s+of\s+([^)]+)\)/g, (_, varName, iterable) => {
    return 'for (var _i = 0, _arr = ' + iterable + '; _i < _arr.length; _i++) { var ' + varName + ' = _arr[_i];';
  });
}

function transformShorthandMethods(code: string): string {
  // { foo() {} } -> not handled deeply, but simple case
  return code;
}

function transformOptionalChaining(code: string): string {
  // obj?.prop -> (obj == null ? undefined : obj.prop)
  code = code.replace(/(\w+(?:\.\w+)*)\?\.(\w+)/g, '($1 == null ? undefined : $1.$2)');
  // obj?.[expr]
  code = code.replace(/(\w+(?:\.\w+)*)\?\.\[([^\]]+)\]/g, '($1 == null ? undefined : $1[$2])');
  // obj?.()
  code = code.replace(/(\w+(?:\.\w+)*)\?\.\(/g, '($1 == null ? undefined : $1(');
  return code;
}

function transformNullishCoalescing(code: string): string {
  // a ?? b -> (a != null ? a : b)
  return code.replace(/(\S+)\s*\?\?\s*(\S+)/g, '($1 != null ? $1 : $2)');
}

function transformJsx(code: string): string {
  // Basic JSX to React.createElement
  code = code.replace(/<(\w+)([^>]*)>([\s\S]*?)<\/\1>/g, (_, tag, attrs, children) => {
    const attrStr = attrs.trim() ? ', ' + attrs.trim().replace(/(\w+)=("[^"]*"|\{[^}]*\})/g, '{ $1: $2 }') : ', null';
    return 'React.createElement("' + tag + '"' + attrStr + ', ' + children.trim() + ')';
  });
  code = code.replace(/<(\w+)([^>]*?)\s*\/>/g, (_, tag, attrs) => {
    const attrStr = attrs.trim() ? ', ' + attrs.trim().replace(/(\w+)=("[^"]*"|\{[^}]*\})/g, '{ $1: $2 }') : ', null';
    return 'React.createElement("' + tag + '"' + attrStr + ')';
  });
  return code;
}

function transformTypeScript(code: string): string {
  // Remove type annotations
  // : type after params
  code = code.replace(/:\s*\w+(?:\[\])?(?:\s*\|\s*\w+(?:\[\])?)*(?=\s*[=;,)]|$)/g, '');
  // interface blocks
  code = code.replace(/interface\s+\w+\s*\{[^}]*\}/g, '');
  // type aliases
  code = code.replace(/type\s+\w+\s*=\s*[^;]+;/g, '');
  // generics
  code = code.replace(/<[A-Z]\w*(?:\s+extends\s+\w+)?(?:,\s*[A-Z]\w*(?:\s+extends\s+\w+)?)*>/g, '');
  // as / ! assertions
  code = code.replace(/\s+as\s+\w+(?:\[\])?/g, '');
  code = code.replace(/\!\s*\./g, '.');
  // readonly
  code = code.replace(/\breadonly\s+/g, '');
  // enum
  code = code.replace(/enum\s+(\w+)\s*\{([^}]*)\}/g, (_, name, body) => {
    const items = body.split(',').filter((s: string) => s.trim());
    let result = 'var ' + name + ' = {\n';
    items.forEach((item: string, idx: number) => {
      const parts = item.trim().split('=');
      const key = parts[0].trim();
      const val = parts.length > 1 ? parts[1].trim() : idx;
      result += '  ' + key + ': ' + val + ',\n';
    });
    result += '};';
    return result;
  });
  // public/private/protected
  code = code.replace(/\b(public|private|protected)\s+/g, '');
  return code;
}
</script>
