<template>
  <div class="space-y-4">
    <TabView :tabs="['分割', '合并']">
      <template #tab-0>
        <div class="space-y-4">
          <TextInput v-model="splitInput" label="输入文本" placeholder="请输入要分割的文本" :rows="8" show-count />
          <div>
            <label class="block text-xs font-medium mb-1" style="color: var(--color-text-secondary);">分隔符</label>
            <input v-model="splitDelimiter" type="text" placeholder="输入分隔符，如 , 或 |" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "  />
          </div>
          <div class="flex items-center gap-3">
          </div>
          <TextOutput v-model="splitOutput" label="分割结果" :rows="8" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-4">
          <TextInput v-model="joinInput" label="输入文本" placeholder="请输入要合并的文本（每行一个条目）" :rows="8" show-count />
          <div>
            <label class="block text-xs font-medium mb-1" style="color: var(--color-text-secondary);">连接符</label>
            <input v-model="joinDelimiter" type="text" placeholder="输入连接符，如 , 或 |" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "  />
          </div>
          <div class="flex items-center gap-3">
          </div>
          <TextOutput v-model="joinOutput" label="合并结果" :rows="8" />
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import TabView from '../../common/TabView.vue';

const splitInput = ref('');
const splitOutput = ref('');
const splitDelimiter = ref(',');

const joinInput = ref('');
const joinOutput = ref('');
const joinDelimiter = ref(',');

function doSplit() {
  if (splitInput.value === '') {
    splitOutput.value = '';
    return;
  }
  const delimiter = splitDelimiter.value || ',';
  splitOutput.value = splitInput.value.split(delimiter).map(s => s.trim()).filter(s => s !== '').join('\n');
}

function doJoin() {
  if (joinInput.value === '') {
    joinOutput.value = '';
    return;
  }
  const delimiter = joinDelimiter.value || ',';
  joinOutput.value = joinInput.value.split('\n').filter(line => line.trim() !== '').join(delimiter);
}
</script>
