<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入 XML" placeholder="在此粘贴需要格式化的 XML..." :rows="12" show-count />

    <div class="flex justify-end">
      <button
        @click="format"
        :disabled="!input.trim()"
        class="btn-primary"
      >
        格式化
      </button>
    </div>

    <ErrorAlert :message="error" />

    <TextOutput v-model="output" label="格式化结果" :rows="12" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const input = ref('');
const output = ref('');
const error = ref('');

function format() {
  error.value = '';
  try {
    let xml = input.value.trim();

    // Remove existing whitespace between tags
    xml = xml.replace(/>\s+</g, '><');

    let formatted = '';
    let indent = 0;
    const indentSize = 2;
    let i = 0;

    while (i < xml.length) {
      if (xml[i] === '<') {
        // Check if it's a closing tag
        if (xml[i + 1] === '/') {
          indent = Math.max(0, indent - 1);
          if (!formatted.endsWith('\n') && formatted.length > 0) {
            formatted += '\n';
          }
          formatted += ' '.repeat(indent * indentSize);
          // Get the whole closing tag
          let j = i;
          while (j < xml.length && xml[j] !== '>') j++;
          formatted += xml.substring(i, j + 1);
          i = j + 1;
        } else if (xml[i + 1] === '?' || xml[i + 1] === '!') {
          // Declaration or comment
          if (!formatted.endsWith('\n') && formatted.length > 0) {
            formatted += '\n';
          }
          formatted += ' '.repeat(indent * indentSize);
          let j = i;
          while (j < xml.length && xml[j] !== '>') j++;
          formatted += xml.substring(i, j + 1);
          i = j + 1;
        } else {
          // Opening tag
          if (!formatted.endsWith('\n') && formatted.length > 0) {
            formatted += '\n';
          }
          formatted += ' '.repeat(indent * indentSize);
          let j = i;
          while (j < xml.length && xml[j] !== '>') j++;

          const tagContent = xml.substring(i, j + 1);
          const isSelfClosing = tagContent.endsWith('/>');

          formatted += tagContent;

          if (!isSelfClosing) {
            indent++;
          }
          i = j + 1;
        }
      } else {
        // Text content
        let j = i;
        while (j < xml.length && xml[j] !== '<') j++;
        const text = xml.substring(i, j).trim();
        if (text) {
          formatted += text;
        }
        i = j;
      }
    }

    output.value = formatted.trim();
  } catch (e: any) {
    error.value = '格式化失败: ' + e.message;
  }
}
</script>
