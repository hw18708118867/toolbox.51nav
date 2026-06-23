<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <!-- Anchors -->
      <div class="reveal-item rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
        <h3 class="text-sm font-medium mb-3" style="color: var(--color-primary);">定位符</h3>
        <div class="space-y-2">
          <div v-for="item in anchors" :key="item.pattern" class="flex gap-3 text-xs">
            <code class="font-mono px-1.5 py-0.5 rounded w-16 text-center shrink-0" style="background-color: var(--color-bg-tertiary); color: var(--color-primary);">{{ item.pattern }}</code>
            <span style="color: var(--color-text-secondary);">{{ item.desc }}</span>
          </div>
        </div>
      </div>

      <!-- Character Classes -->
      <div class="reveal-item rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
        <h3 class="text-sm font-medium mb-3" style="color: var(--color-primary);">字符类</h3>
        <div class="space-y-2">
          <div v-for="item in charClasses" :key="item.pattern" class="flex gap-3 text-xs">
            <code class="font-mono px-1.5 py-0.5 rounded w-16 text-center shrink-0" style="background-color: var(--color-bg-tertiary); color: var(--color-primary);">{{ item.pattern }}</code>
            <span style="color: var(--color-text-secondary);">{{ item.desc }}</span>
          </div>
        </div>
      </div>

      <!-- Quantifiers -->
      <div class="reveal-item rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
        <h3 class="text-sm font-medium mb-3" style="color: var(--color-primary);">量词</h3>
        <div class="space-y-2">
          <div v-for="item in quantifiers" :key="item.pattern" class="flex gap-3 text-xs">
            <code class="font-mono px-1.5 py-0.5 rounded w-16 text-center shrink-0" style="background-color: var(--color-bg-tertiary); color: var(--color-primary);">{{ item.pattern }}</code>
            <span style="color: var(--color-text-secondary);">{{ item.desc }}</span>
          </div>
        </div>
      </div>

      <!-- Groups -->
      <div class="reveal-item rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
        <h3 class="text-sm font-medium mb-3" style="color: var(--color-primary);">分组与引用</h3>
        <div class="space-y-2">
          <div v-for="item in groups" :key="item.pattern" class="flex gap-3 text-xs">
            <code class="font-mono px-1.5 py-0.5 rounded w-16 text-center shrink-0" style="background-color: var(--color-bg-tertiary); color: var(--color-primary);">{{ item.pattern }}</code>
            <span style="color: var(--color-text-secondary);">{{ item.desc }}</span>
          </div>
        </div>
      </div>

      <!-- Lookarounds -->
      <div class="reveal-item rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
        <h3 class="text-sm font-medium mb-3" style="color: var(--color-primary);">环视</h3>
        <div class="space-y-2">
          <div v-for="item in lookarounds" :key="item.pattern" class="flex gap-3 text-xs">
            <code class="font-mono px-1.5 py-0.5 rounded w-20 text-center shrink-0" style="background-color: var(--color-bg-tertiary); color: var(--color-primary);">{{ item.pattern }}</code>
            <span style="color: var(--color-text-secondary);">{{ item.desc }}</span>
          </div>
        </div>
      </div>

      <!-- Common Patterns -->
      <div class="reveal-item rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
        <h3 class="text-sm font-medium mb-3" style="color: var(--color-primary);">常用正则</h3>
        <div class="space-y-2">
          <div v-for="item in commonPatterns" :key="item.pattern" class="text-xs">
            <div class="text-xs mb-0.5" style="color: var(--color-text-secondary);">{{ item.desc }}</div>
            <code class="font-mono text-xs px-1.5 py-0.5 rounded block break-all" style="background-color: var(--color-bg-tertiary); color: var(--color-text);">{{ item.pattern }}</code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const anchors = [
  { pattern: '^', desc: '匹配字符串开头' },
  { pattern: '$', desc: '匹配字符串结尾' },
  { pattern: '\\b', desc: '单词边界' },
  { pattern: '\\B', desc: '非单词边界' },
];

const charClasses = [
  { pattern: '.', desc: '任意字符（除换行）' },
  { pattern: '\\d', desc: '数字 [0-9]' },
  { pattern: '\\D', desc: '非数字' },
  { pattern: '\\w', desc: '单词字符 [a-zA-Z0-9_]' },
  { pattern: '\\W', desc: '非单词字符' },
  { pattern: '\\s', desc: '空白字符' },
  { pattern: '\\S', desc: '非空白字符' },
  { pattern: '[abc]', desc: '匹配 a、b 或 c' },
  { pattern: '[^abc]', desc: '不匹配 a、b、c' },
];

const quantifiers = [
  { pattern: '*', desc: '0 次或多次' },
  { pattern: '+', desc: '1 次或多次' },
  { pattern: '?', desc: '0 次或 1 次' },
  { pattern: '{n}', desc: '恰好 n 次' },
  { pattern: '{n,}', desc: '至少 n 次' },
  { pattern: '{n,m}', desc: 'n 到 m 次' },
];

const groups = [
  { pattern: '(expr)', desc: '捕获组' },
  { pattern: '(?:expr)', desc: '非捕获组' },
  { pattern: '\\1, \\2', desc: '反向引用' },
  { pattern: '(?<n>)', desc: '命名捕获组' },
  { pattern: '|', desc: '或（OR）' },
];

const lookarounds = [
  { pattern: '(?=expr)', desc: '正向前瞻' },
  { pattern: '(?!expr)', desc: '负向前瞻' },
  { pattern: '(?<=expr)', desc: '正向后顾' },
  { pattern: '(?<!expr)', desc: '负向后顾' },
];

const commonPatterns = [
  { desc: '邮箱地址', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
  { desc: '手机号码（中国）', pattern: '^1[3-9]\\d{9}$' },
  { desc: 'URL', pattern: '^https?://[\\w.-]+(:\\d+)?(/.*)?$' },
  { desc: 'IP 地址', pattern: '^(\\d{1,3}\\.){3}\\d{1,3}$' },
  { desc: '日期 (YYYY-MM-DD)', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
  { desc: '中文汉字', pattern: '^[\\u4e00-\\u9fa5]+$' },
];
</script>
