<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要处理的文本" :rows="10" show-count />
    <div class="flex items-center gap-3">
    </div>
    <TextOutput v-model="output" label="处理结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');

function trimLines() {
  if (input.value === '') {
    output.value = '';
    return;
  }
  output.value = input.value.split('\n').map(line => line.trimEnd()).join('\n');
}
</script>
