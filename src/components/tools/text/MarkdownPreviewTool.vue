<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <TextInput v-model="input" label="Markdown 输入" placeholder="请输入 Markdown 文本" :rows="20" show-count />
    <div>
      <div class="flex items-center justify-between mb-1.5">
        <label class="text-xs font-medium" style="color: var(--color-text-secondary);">预览</label>
        <CopyButton v-if="input" :text="input" />
      </div>
      <div
        class="w-full rounded-md border px-3 py-2 text-sm overflow-auto min-h-[300px] prose prose-sm max-w-none"
        style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text);"
        v-html="renderedHtml"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { marked } from 'marked';
import TextInput from '../../common/TextInput.vue';
import CopyButton from '../../common/CopyButton.vue';

const input = ref('');
const renderedHtml = ref('');

let debounceTimer: ReturnType<typeof setTimeout>;

function updatePreview() {
  if (input.value === '') {
    renderedHtml.value = '';
    return;
  }
  try {
    renderedHtml.value = marked(input.value) as string;
  } catch {
    renderedHtml.value = '<p style="color: red;">Markdown 解析错误</p>';
  }
}

watch(input, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updatePreview, 300);
});
</script>
