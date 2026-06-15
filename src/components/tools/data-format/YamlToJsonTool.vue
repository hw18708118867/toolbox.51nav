<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入 YAML" placeholder="key: value" :rows="10" show-count />
    <div class="flex justify-end">
      <button @click="convert" class="btn-primary">转换为 JSON</button>
    </div>
    <ErrorAlert :message="error" />
    <TextOutput v-model="output" label="JSON 结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import YAML from 'yaml';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const input = ref('');
const output = ref('');
const error = ref('');

function convert() {
  error.value = '';
  try {
    const obj = YAML.parse(input.value);
    output.value = JSON.stringify(obj, null, 2);
  } catch (e: any) {
    error.value = '转换失败: ' + e.message;
  }
}
</script>
