<template>
  <div class="space-y-4">
    <TextInput v-model="mdInput" label="输入 Markdown" placeholder="# 标题&#10;&#10;这是一段**文字**" :rows="10" show-count />
    <div class="flex justify-end">
      <button @click="convert" class="btn-primary">转换</button>
    </div>
    <ErrorAlert :message="error" />
    <TextOutput v-model="output" label="HTML 结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { marked } from 'marked';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const mdInput = ref('');
const output = ref('');
const error = ref('');

function convert() {
  error.value = '';
  output.value = '';
  try {
    if (!mdInput.value.trim()) {
      error.value = '请输入 Markdown 内容';
      return;
    }
    output.value = marked.parse(mdInput.value) as string;
  } catch (e: any) {
    error.value = '转换失败: ' + e.message;
  }
}
</script>
