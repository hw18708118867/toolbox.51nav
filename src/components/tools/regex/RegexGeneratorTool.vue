<template>
  <div class="space-y-4">
    <TabView :tabs="['从示例生成', '常用模式']">
      <!-- Tab 0: Generate from examples -->
      <template #tab-0>
        <div class="space-y-4">
          <div>
            <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">匹配的示例 (每行一个)</label>
            <textarea
              v-model="positiveExamples"
              rows="5"
              class="w-full rounded-md border p-3 text-sm font-mono resize-y"
              style="background: var(--color-bg); color: var(--color-text); border-color: var(--color-border);"
              placeholder="user@example.com&#10;admin@test.org&#10;hello@domain.cn"
            ></textarea>
          </div>

          <div>
            <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">不匹配的示例 (每行一个，可选)</label>
            <textarea
              v-model="negativeExamples"
              rows="3"
              class="w-full rounded-md border p-3 text-sm font-mono resize-y"
              style="background: var(--color-bg); color: var(--color-text); border-color: var(--color-border);"
              placeholder="not-an-email&#10;@missing-user.com"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2">
            <CopyButton v-if="generatedRegex" :text="generatedRegex" />
            <button @click="generateFromExamples" :disabled="!positiveExamples.trim()" class="btn-primary">生成正则</button>
          </div>

          <ErrorAlert :message="error" />

          <div v-if="generatedRegex" class="space-y-3">
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">生成的正则表达式</label>
              <div class="rounded-md border p-3 font-mono text-sm break-all" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);">{{ generatedRegex }}</div>
            </div>

            <!-- Test area -->
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">测试正则</label>
              <div class="flex gap-2">
                <input
                  v-model="testInput"
                  type="text"
                  placeholder="输入测试文本..."
                  class="flex-1 rounded-md border px-3 py-1.5 text-sm"
                  style="background: var(--color-bg); color: var(--color-text); border-color: var(--color-border);"
                  @input="runTest"
                />
              </div>
              <div v-if="testResult !== null" class="mt-2 text-sm" :style="{ color: testResult ? '#166534' : '#991b1b' }">
                {{ testResult ? '匹配成功' : '不匹配' }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Tab 1: Common patterns -->
      <template #tab-1>
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">选择常用模式</label>
            <select v-model="selectedPattern" class="rounded-md border px-3 py-1.5 text-sm flex-1" style="background: var(--color-bg); color: var(--color-text); border-color: var(--color-border);">
              <option value="">-- 请选择 --</option>
              <option value="email">邮箱地址</option>
              <option value="url">URL 网址</option>
              <option value="ipv4">IPv4 地址</option>
              <option value="phone_cn">手机号 (中国大陆)</option>
              <option value="date_iso">日期 (YYYY-MM-DD)</option>
              <option value="hex_color">十六进制颜色值</option>
              <option value="id_card">身份证号 (中国大陆)</option>
              <option value="zip_cn">邮政编码 (中国大陆)</option>
              <option value="mac">MAC 地址</option>
              <option value="domain">域名</option>
            </select>
          </div>

          <div v-if="selectedPattern" class="space-y-3">
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">正则表达式</label>
              <div class="flex items-center gap-2">
                <div class="flex-1 rounded-md border p-3 font-mono text-sm break-all" style="background: var(--color-bg); border-color: var(--color-border); color: var(--color-text);">{{ patternRegex }}</div>
                <CopyButton :text="patternRegex" />
              </div>
            </div>

            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">说明</label>
              <p class="text-sm" style="color: var(--color-text-muted);">{{ patternDescription }}</p>
            </div>

            <!-- Test -->
            <div>
              <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">测试</label>
              <div class="flex gap-2">
                <input
                  v-model="patternTestInput"
                  type="text"
                  :placeholder="patternExample"
                  class="flex-1 rounded-md border px-3 py-1.5 text-sm"
                  style="background: var(--color-bg); color: var(--color-text); border-color: var(--color-border);"
                  @input="runPatternTest"
                />
              </div>
              <div v-if="patternTestResult !== null" class="mt-2 text-sm" :style="{ color: patternTestResult ? '#166534' : '#991b1b' }">
                {{ patternTestResult ? '匹配成功' : '不匹配' }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TabView from '../../common/TabView.vue';
import CopyButton from '../../common/CopyButton.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

// Tab 0: example-based generation
const positiveExamples = ref('');
const negativeExamples = ref('');
const generatedRegex = ref('');
const error = ref('');
const testInput = ref('');
const testResult = ref<boolean | null>(null);

// Tab 1: common patterns
const selectedPattern = ref('');
const patternTestInput = ref('');
const patternTestResult = ref<boolean | null>(null);

const PATTERNS: Record<string, { regex: string; description: string; example: string }> = {
  email: {
    regex: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    description: '匹配标准邮箱地址格式。支持字母、数字、点号、下划线、百分号、加号、减号作为用户名。域名部分至少有一个点号，顶级域名至少2个字符。',
    example: 'user@example.com',
  },
  url: {
    regex: '^https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+(:\\d+)?(\\/[\\w\\-./?%&=#]*)?$',
    description: '匹配 HTTP/HTTPS URL。支持域名、端口号、路径、查询参数。',
    example: 'https://www.example.com/path?query=value',
  },
  ipv4: {
    regex: '^(?:(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)$',
    description: '匹配 IPv4 地址（0.0.0.0 - 255.255.255.255）。',
    example: '192.168.1.1',
  },
  phone_cn: {
    regex: '^1[3-9]\\d{9}$',
    description: '匹配中国大陆手机号码。以1开头，第二位3-9，共11位数字。',
    example: '13800138000',
  },
  date_iso: {
    regex: '^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$',
    description: '匹配 ISO 日期格式 (YYYY-MM-DD)。验证月份01-12，日期01-31。',
    example: '2024-01-15',
  },
  hex_color: {
    regex: '^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$',
    description: '匹配十六进制颜色值，支持3位和6位格式。',
    example: '#FF5733',
  },
  id_card: {
    regex: '^[1-9]\\d{5}(?:19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$',
    description: '匹配中国大陆18位身份证号码。包含地区码、出生日期、顺序码和校验位。',
    example: '110101199001011234',
  },
  zip_cn: {
    regex: '^[1-9]\\d{5}$',
    description: '匹配中国大陆邮政编码（6位数字，首位不为0）。',
    example: '100000',
  },
  mac: {
    regex: '^(?:[0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$',
    description: '匹配 MAC 地址，分隔符为冒号或短横线。',
    example: '00:1A:2B:3C:4D:5E',
  },
  domain: {
    regex: '^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}$',
    description: '匹配域名。支持多级子域名，每级1-63个字符，顶级域名至少2个字符。',
    example: 'www.example.com',
  },
};

const patternRegex = computed(() => {
  return PATTERNS[selectedPattern.value]?.regex || '';
});

const patternDescription = computed(() => {
  return PATTERNS[selectedPattern.value]?.description || '';
});

const patternExample = computed(() => {
  return PATTERNS[selectedPattern.value]?.example || '';
});

function generateFromExamples() {
  error.value = '';
  generatedRegex.value = '';
  testResult.value = null;

  try {
    const positives = positiveExamples.value
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const negatives = negativeExamples.value
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (positives.length === 0) {
      error.value = '请至少输入一个匹配的示例';
      return;
    }

    const regex = inferRegex(positives, negatives);
    generatedRegex.value = regex;
  } catch (e: any) {
    error.value = '生成失败: ' + e.message;
  }
}

function inferRegex(positives: string[], negatives: string[]): string {
  // Try to detect the pattern type from the examples
  const patternType = detectPatternType(positives);

  switch (patternType) {
    case 'email':
      return '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
    case 'url':
      return '^https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+(:\\d+)?(\\/[\\w\\-./?%&=#]*)?$';
    case 'ipv4':
      return '^(?:(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)$';
    case 'hex_color':
      return '^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$';
    case 'date':
      return '^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$';
    case 'phone':
      return '^1[3-9]\\d{9}$';
    default:
      // Build a literal regex that matches all positive examples
      return buildLiteralRegex(positives, negatives);
  }
}

function detectPatternType(examples: string[]): string {
  const emailRe = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const urlRe = /^https?:\/\/.+/;
  const ipv4Re = /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/;
  const hexColorRe = /^#[0-9a-fA-F]{3,6}$/;
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const phoneRe = /^1[3-9]\d{9}$/;

  const all = (re: RegExp) => examples.every(e => re.test(e));

  if (all(emailRe)) return 'email';
  if (all(urlRe)) return 'url';
  if (all(ipv4Re)) return 'ipv4';
  if (all(hexColorRe)) return 'hex_color';
  if (all(dateRe)) return 'date';
  if (all(phoneRe)) return 'phone';

  return 'literal';
}

function buildLiteralRegex(positives: string[], negatives: string[]): string {
  // Escape all the positive strings
  const escaped = positives.map(s => escapeRegex(s));

  // Try to find common prefix/suffix and generate a pattern
  if (positives.length === 1) {
    return '^' + escaped[0] + '$';
  }

  // Find common prefix
  const prefix = commonPrefix(positives);
  const suffix = commonSuffix(positives);

  let pattern = '^';
  if (prefix) pattern += escapeRegex(prefix);

  // Analyze remaining middle parts
  const middles = positives.map(s => s.slice(prefix.length, s.length - suffix.length));

  // Check if middles are all digits
  if (middles.every(m => /^\d+$/.test(m))) {
    const minLen = Math.min(...middles.map(m => m.length));
    const maxLen = Math.max(...middles.map(m => m.length));
    if (minLen === maxLen) {
      pattern += `\\d{${minLen}}`;
    } else {
      pattern += `\\d{${minLen},${maxLen}}`;
    }
  } else if (middles.every(m => /^[a-zA-Z]+$/.test(m))) {
    const minLen = Math.min(...middles.map(m => m.length));
    const maxLen = Math.max(...middles.map(m => m.length));
    if (minLen === maxLen) {
      pattern += `[a-zA-Z]{${minLen}}`;
    } else {
      pattern += `[a-zA-Z]{${minLen},${maxLen}}`;
    }
  } else if (middles.every(m => /^[a-zA-Z0-9]+$/.test(m))) {
    const minLen = Math.min(...middles.map(m => m.length));
    const maxLen = Math.max(...middles.map(m => m.length));
    if (minLen === maxLen) {
      pattern += `[a-zA-Z0-9]{${minLen}}`;
    } else {
      pattern += `[a-zA-Z0-9]{${minLen},${maxLen}}`;
    }
  } else {
    // Just alternate the middles
    pattern += `(?:${escaped.map(e => e.slice(prefix.length, e.length - suffix.length)).join('|')})`;
  }

  if (suffix) pattern += escapeRegex(suffix);
  pattern += '$';

  return pattern;
}

function commonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  let prefix = strings[0];
  for (let i = 1; i < strings.length; i++) {
    while (!strings[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (prefix === '') return '';
    }
  }
  return prefix;
}

function commonSuffix(strings: string[]): string {
  if (strings.length === 0) return '';
  const reversed = strings.map(s => s.split('').reverse().join(''));
  const revPrefix = commonPrefix(reversed);
  return revPrefix.split('').reverse().join('');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function runTest() {
  testResult.value = null;
  if (!generatedRegex.value || !testInput.value) return;
  try {
    const re = new RegExp(generatedRegex.value);
    testResult.value = re.test(testInput.value);
  } catch {
    testResult.value = false;
  }
}

function runPatternTest() {
  patternTestResult.value = null;
  if (!patternRegex.value || !patternTestInput.value) return;
  try {
    const re = new RegExp('^' + patternRegex.value.slice(1, -1) + '$');
    patternTestResult.value = re.test(patternTestInput.value);
  } catch {
    patternTestResult.value = false;
  }
}
</script>
