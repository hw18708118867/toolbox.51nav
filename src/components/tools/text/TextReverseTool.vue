<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要反转的文本" :rows="10" show-count />
    <div class="flex flex-wrap items-center gap-3">
      <select v-model="reverseMode" class="px-3 py-2 rounded-md border text-sm focus:outline-none " >
        <option value="char">字符反转</option>
        <option value="line">行反转</option>
      </select>
    </div>
    <TextOutput v-model="output" label="反转结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');
const reverseMode = ref<'char' | 'line'>('char');

function reverseText() {
  if (input.value === '') {
    output.value = '';
    return;
  }
  if (reverseMode.value === 'char') {
    output.value = [...input.value].reverse().join('');
  } else {
    output.value = input.value.split('\n').reverse().join('\n');
  }
}
</script>
