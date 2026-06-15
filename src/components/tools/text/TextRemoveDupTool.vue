<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要处理的文本" :rows="10" show-count />
    <div class="flex items-center gap-3">
      <span v-if="removedCount !== null" class="text-sm" style="color: var(--color-text-secondary);">
        共移除 <strong style="color: var(--color-primary);">{{ removedCount }}</strong> 个重复行
      </span>
    </div>
    <TextOutput v-model="output" label="去重结果" :rows="10" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');
const removedCount = ref<number | null>(null);

function removeDup() {
  if (input.value === '') {
    output.value = '';
    removedCount.value = null;
    return;
  }
  const lines = input.value.split('\n');
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    if (!seen.has(line)) {
      seen.add(line);
      result.push(line);
    }
  }
  output.value = result.join('\n');
  removedCount.value = lines.length - result.length;
}
</script>
