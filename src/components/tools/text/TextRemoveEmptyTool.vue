<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要处理的文本" :rows="10" show-count />
    <div class="flex items-center gap-3">
      <span v-if="removedCount !== null" class="text-sm" style="color: var(--color-text-secondary);">
        共移除 <strong style="color: var(--color-primary);">{{ removedCount }}</strong> 个空行
      </span>
    </div>
    <TextOutput v-model="output" label="去空行结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');
const removedCount = ref<number | null>(null);

function removeEmpty() {
  if (input.value === '') {
    output.value = '';
    removedCount.value = null;
    return;
  }
  const lines = input.value.split('\n');
  const nonEmpty = lines.filter(line => line.trim() !== '');
  output.value = nonEmpty.join('\n');
  removedCount.value = lines.length - nonEmpty.length;
}
</script>
