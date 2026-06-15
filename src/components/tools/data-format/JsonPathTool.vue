<template>
  <div class="space-y-4">
    <TextInput v-model="jsonInput" label="输入 JSON 数据" placeholder='{"store":{"book":[{"title":"Book A","price":10},{"title":"Book B","price":20}]}}' :rows="8" show-count />

    <div class="flex items-center gap-3">
      <label class="text-xs font-medium shrink-0" style="color: var(--color-text-secondary);">JSONPath 表达式</label>
      <input v-model="pathExpr" type="text" placeholder="$.store.book[*].title" class="flex-1 rounded-md border px-3 py-1.5 text-sm font-mono focus:outline-none" style="background: var(--color-bg); color: var(--color-text); border-color: var(--color-border);" @keydown.enter="evaluate" />
      <button @click="evaluate" :disabled="!jsonInput.trim() || !pathExpr.trim()" class="btn-primary shrink-0">查询</button>
    </div>

    <ErrorAlert :message="error" />

    <div v-if="result !== null" class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium" style="color: var(--color-text-secondary);">查询结果 ({{ Array.isArray(result) ? result.length + ' 个匹配' : '1 个匹配' }})</span>
        <CopyButton :text="resultStr" />
      </div>
      <div class="rounded-md border p-3 max-h-80 overflow-auto" style="background: var(--color-bg); border-color: var(--color-border);">
        <pre class="text-sm font-mono whitespace-pre-wrap" style="color: var(--color-text);">{{ resultStr }}</pre>
      </div>
    </div>

    <details class="rounded-md border p-3" style="background: var(--color-bg); border-color: var(--color-border);">
      <summary class="text-xs font-medium cursor-pointer" style="color: var(--color-text-secondary);">JSONPath 语法参考</summary>
      <div class="mt-2 text-xs space-y-1" style="color: var(--color-text-secondary);">
        <p><code class="font-mono" style="background: var(--color-bg-secondary); padding: 1px 4px; border-radius: 2px;">$</code> — 根对象</p>
        <p><code class="font-mono" style="background: var(--color-bg-secondary); padding: 1px 4px; border-radius: 2px;">$.prop</code> — 属性访问</p>
        <p><code class="font-mono" style="background: var(--color-bg-secondary); padding: 1px 4px; border-radius: 2px;">$[0]</code> — 数组索引</p>
        <p><code class="font-mono" style="background: var(--color-bg-secondary); padding: 1px 4px; border-radius: 2px;">$[*]</code> — 所有数组元素</p>
        <p><code class="font-mono" style="background: var(--color-bg-secondary); padding: 1px 4px; border-radius: 2px;">$..prop</code> — 递归查找所有属性</p>
        <p><code class="font-mono" style="background: var(--color-bg-secondary); padding: 1px 4px; border-radius: 2px;">$[?(@.price > 10)]</code> — 过滤</p>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TextInput from '../../common/TextInput.vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const jsonInput = ref('');
const pathExpr = ref('$');
const error = ref('');
const result = ref<any>(null);

const resultStr = computed(() => {
  if (result.value === null || result.value === undefined) return 'null';
  if (typeof result.value === 'string') return result.value;
  return JSON.stringify(result.value, null, 2);
});

function evaluate() {
  error.value = '';
  result.value = null;
  try {
    const data = JSON.parse(jsonInput.value);
    const path = pathExpr.value.trim();
    if (!path.startsWith('$')) {
      error.value = 'JSONPath 表达式必须以 $ 开头';
      return;
    }
    const matches = jsonPath(data, path);
    result.value = matches.length === 1 ? matches[0] : matches;
  } catch (e: any) {
    error.value = '查询失败: ' + e.message;
  }
}

interface Token {
  type: 'root' | 'dot' | 'bracket' | 'recursive' | 'filter';
  value: string;
}

function tokenize(path: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < path.length) {
    if (path[i] === '$') {
      tokens.push({ type: 'root', value: '$' });
      i++;
    } else if (path[i] === '.' && path[i + 1] === '.') {
      // Recursive descent
      i += 2;
      // Read the property name after ..
      let prop = '';
      while (i < path.length && path[i] !== '.' && path[i] !== '[') {
        prop += path[i];
        i++;
      }
      tokens.push({ type: 'recursive', value: prop });
    } else if (path[i] === '.') {
      i++;
      let prop = '';
      while (i < path.length && path[i] !== '.' && path[i] !== '[') {
        prop += path[i];
        i++;
      }
      tokens.push({ type: 'dot', value: prop });
    } else if (path[i] === '[') {
      i++;
      let bracketContent = '';
      let depth = 1;
      while (i < path.length && depth > 0) {
        if (path[i] === '[') depth++;
        else if (path[i] === ']') depth--;
        if (depth > 0) bracketContent += path[i];
        i++;
      }
      if (bracketContent.startsWith('?(')) {
        tokens.push({ type: 'filter', value: bracketContent });
      } else if (bracketContent === '*') {
        tokens.push({ type: 'bracket', value: '*' });
      } else {
        tokens.push({ type: 'bracket', value: bracketContent });
      }
    } else {
      i++;
    }
  }
  return tokens;
}

function jsonPath(data: any, path: string): any[] {
  const tokens = tokenize(path);
  return applyTokens(data, tokens);
}

function applyTokens(data: any, tokens: Token[]): any[] {
  let results: any[] = [data];

  for (const token of tokens) {
    if (token.type === 'root') continue;
    const newResults: any[] = [];

    for (const item of results) {
      const found = applyToken(item, token);
      newResults.push(...found);
    }
    results = newResults;
    if (results.length === 0) break;
  }

  return results;
}

function applyToken(data: any, token: Token): any[] {
  switch (token.type) {
    case 'dot': {
      if (data !== null && typeof data === 'object' && !Array.isArray(data) && token.value in data) {
        const val = data[token.value];
        return [val];
      }
      return [];
    }
    case 'bracket': {
      if (token.value === '*') {
        if (Array.isArray(data)) {
          return [...data];
        } else if (data !== null && typeof data === 'object') {
          return Object.values(data);
        }
        return [];
      }
      // Bracket property access (with quotes): ['prop'] or ["prop"]
      let key = token.value;
      if ((key.startsWith("'") && key.endsWith("'")) || (key.startsWith('"') && key.endsWith('"'))) {
        key = key.slice(1, -1);
      }
      if (data !== null && typeof data === 'object') {
        if (Array.isArray(data)) {
          // Check if it's an index or slice
          const idx = parseInt(key);
          if (!isNaN(idx) && idx >= 0 && idx < data.length) {
            return [data[idx]];
          }
          // Try as property name
          if (key in data) {
            return [data[key]];
          }
        } else {
          if (key in data) {
            return [data[key]];
          }
        }
      }
      return [];
    }
    case 'recursive': {
      const found: any[] = [];
      collectProps(data, token.value, found);
      return found;
    }
    case 'filter': {
      const expr = token.value.replace(/^\?\((.*)\)$/, '$1');
      return applyFilter(data, expr);
    }
    default:
      return [];
  }
}

function collectProps(obj: any, propName: string, results: any[]) {
  if (obj === null || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      collectProps(item, propName, results);
    }
  } else {
    if (propName in obj) {
      results.push(obj[propName]);
    }
    for (const value of Object.values(obj)) {
      collectProps(value, propName, results);
    }
  }
}

function applyFilter(data: any, expr: string): any[] {
  if (!Array.isArray(data)) return [];

  const results: any[] = [];

  // Parse simple filter: @.prop op value
  // Support: @.price > 10, @.name == "test", @.age >= 18
  const filterRe = /@\.(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)/;
  const m = expr.match(filterRe);

  if (!m) {
    // Simple existence check: @.prop
    const existRe = /^@\.(\w+)$/;
    const em = expr.match(existRe);
    if (em) {
      for (const item of data) {
        if (item !== null && typeof item === 'object' && em[1] in item) {
          results.push(item);
        }
      }
      return results;
    }
    return results;
  }

  const [, prop, op, rawVal] = m;
  let cmpVal: any = rawVal.trim();

  // Parse comparison value
  if ((cmpVal.startsWith("'") && cmpVal.endsWith("'")) || (cmpVal.startsWith('"') && cmpVal.endsWith('"'))) {
    cmpVal = cmpVal.slice(1, -1); // string
  } else if (cmpVal === 'true') {
    cmpVal = true;
  } else if (cmpVal === 'false') {
    cmpVal = false;
  } else if (cmpVal === 'null') {
    cmpVal = null;
  } else {
    cmpVal = parseFloat(cmpVal);
  }

  for (const item of data) {
    if (item === null || typeof item !== 'object') continue;
    if (!(prop in item)) continue;
    const itemVal = item[prop];

    let match = false;
    switch (op) {
      case '==': match = itemVal == cmpVal; break;
      case '!=': match = itemVal != cmpVal; break;
      case '>': match = itemVal > cmpVal; break;
      case '>=': match = itemVal >= cmpVal; break;
      case '<': match = itemVal < cmpVal; break;
      case '<=': match = itemVal <= cmpVal; break;
    }
    if (match) {
      results.push(item);
    }
  }

  return results;
}
</script>
