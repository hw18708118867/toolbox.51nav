<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要提取的文本" :rows="10" show-count />
    <div class="flex flex-wrap items-center gap-3">
      <select v-model="extractType" class="px-3 py-2 rounded-md border text-sm focus:outline-none " >
        <option value="email">邮箱</option>
        <option value="url">URL</option>
        <option value="ip">IP地址</option>
        <option value="phone">手机号</option>
      </select>
      <span v-if="extractedCount !== null" class="text-sm" style="color: var(--color-text-secondary);">
        共提取 <strong style="color: var(--color-primary);">{{ extractedCount }}</strong> 项
      </span>
    </div>
    <TextOutput v-model="output" label="提取结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');
const extractType = ref<'email' | 'url' | 'ip' | 'phone'>('email');
const extractedCount = ref<number | null>(null);

const patterns: Record<string, RegExp> = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  url: /https?:\/\/[^\s"'<>，。；！？、（）《》]+/g,
  ip: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
  phone: /1[3-9]\d{9}/g,
};

function doExtract() {
  if (input.value === '') {
    output.value = '';
    extractedCount.value = null;
    return;
  }
  const regex = patterns[extractType.value] || patterns.email;
  const matches = input.value.match(regex);
  if (matches && matches.length > 0) {
    output.value = [...new Set(matches)].join('\n');
    extractedCount.value = matches.length;
  } else {
    output.value = '';
    extractedCount.value = 0;
  }
}

watch([input, extractType], doExtract);
</script>
