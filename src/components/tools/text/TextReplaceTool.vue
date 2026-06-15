<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要处理的文本" :rows="8" show-count />

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium mb-1" style="color: var(--color-text-secondary);">查找内容</label>
        <input v-model="findText" type="text" placeholder="查找文本或正则表达式" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "  />
      </div>
      <div>
        <label class="block text-xs font-medium mb-1" style="color: var(--color-text-secondary);">替换为</label>
        <input v-model="replaceText" type="text" placeholder="替换文本" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "  />
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-4">
      <label class="flex items-center gap-2 text-sm cursor-pointer" style="color: var(--color-text-secondary);">
        <input v-model="caseSensitive" type="checkbox" class="rounded" />
        区分大小写
      </label>
      <label class="flex items-center gap-2 text-sm cursor-pointer" style="color: var(--color-text-secondary);">
        <input v-model="useRegex" type="checkbox" class="rounded" />
        正则表达式
      </label>
    </div>

    <ErrorAlert v-if="errorMsg" :message="errorMsg" />

    <div class="flex items-center gap-3">
      <span v-if="replaceCount !== null" class="text-sm" style="color: var(--color-text-secondary);">
        共替换 <strong style="color: var(--color-primary);">{{ replaceCount }}</strong> 处
      </span>
    </div>

    <TextOutput v-model="output" label="替换结果" :rows="8" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const input = ref('');
const output = ref('');
const findText = ref('');
const replaceText = ref('');
const caseSensitive = ref(false);
const useRegex = ref(false);
const errorMsg = ref('');
const replaceCount = ref<number | null>(null);

function doReplace() {
  errorMsg.value = '';
  replaceCount.value = null;

  if (input.value === '' || findText.value === '') {
    output.value = input.value;
    return;
  }

  try {
    if (useRegex.value) {
      const flags = caseSensitive.value ? 'g' : 'gi';
      const regex = new RegExp(findText.value, flags);
      let count = 0;
      const result = input.value.replace(regex, (...args) => {
        count++;
        return replaceText.value;
      });
      output.value = result;
      replaceCount.value = count;
    } else {
      let count = 0;
      let result: string;
      if (caseSensitive.value) {
        const escaped = findText.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'g');
        result = input.value.replace(regex, (...args) => {
          count++;
          return replaceText.value;
        });
      } else {
        let pos = 0;
        const lowerInput = input.value.toLowerCase();
        const lowerFind = findText.value.toLowerCase();
        const parts: string[] = [];
        while (pos < input.value.length) {
          const idx = lowerInput.indexOf(lowerFind, pos);
          if (idx === -1) {
            parts.push(input.value.slice(pos));
            break;
          }
          parts.push(input.value.slice(pos, idx));
          parts.push(replaceText.value);
          count++;
          pos = idx + findText.value.length;
        }
        result = parts.join('');
      }
      output.value = result;
      replaceCount.value = count;
    }
  } catch (e: unknown) {
    const err = e as Error;
    errorMsg.value = '正则表达式错误: ' + err.message;
    output.value = input.value;
  }
}
</script>
