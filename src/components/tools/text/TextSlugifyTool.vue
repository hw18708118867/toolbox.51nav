<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要转换为 slug 的文本" :rows="6" show-count />
    <div class="flex items-center gap-3">
    </div>
    <TextOutput v-model="output" label="Slug 结果" :rows="6" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');

function slugify() {
  if (input.value === '') {
    output.value = '';
    return;
  }
  output.value = input.value
    .toLowerCase()
    .replace(/[^\w一-鿿\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
</script>
