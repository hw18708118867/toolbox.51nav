<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入要转换的文本" :rows="5" show-count />
    <div class="flex flex-wrap gap-2">
      <button @click="convert('upper')" class="px-3 py-1.5 rounded-md text-xs border transition-colors hover:border-[var(--color-primary)]" style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text-secondary);">UPPERCASE</button>
      <button @click="convert('lower')" class="px-3 py-1.5 rounded-md text-xs border transition-colors hover:border-[var(--color-primary)]" style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text-secondary);">lowercase</button>
      <button @click="convert('title')" class="px-3 py-1.5 rounded-md text-xs border transition-colors hover:border-[var(--color-primary)]" style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text-secondary);">Title Case</button>
      <button @click="convert('sentence')" class="px-3 py-1.5 rounded-md text-xs border transition-colors hover:border-[var(--color-primary)]" style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text-secondary);">Sentence case</button>
      <button @click="convert('camel')" class="px-3 py-1.5 rounded-md text-xs border transition-colors hover:border-[var(--color-primary)]" style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text-secondary);">camelCase</button>
      <button @click="convert('pascal')" class="px-3 py-1.5 rounded-md text-xs border transition-colors hover:border-[var(--color-primary)]" style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text-secondary);">PascalCase</button>
      <button @click="convert('snake')" class="px-3 py-1.5 rounded-md text-xs border transition-colors hover:border-[var(--color-primary)]" style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text-secondary);">snake_case</button>
      <button @click="convert('kebab')" class="px-3 py-1.5 rounded-md text-xs border transition-colors hover:border-[var(--color-primary)]" style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text-secondary);">kebab-case</button>
      <button @click="convert('constant')" class="px-3 py-1.5 rounded-md text-xs border transition-colors hover:border-[var(--color-primary)]" style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text-secondary);">CONSTANT_CASE</button>
    </div>
    <TextOutput v-model="output" label="转换结果" :rows="5" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';

const input = ref('');
const output = ref('');

function toWords(text: string): string[] {
  return text.replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function convert(type: string) {
  const words = toWords(input.value);
  switch (type) {
    case 'upper':
      output.value = input.value.toUpperCase(); break;
    case 'lower':
      output.value = input.value.toLowerCase(); break;
    case 'title':
      output.value = input.value.replace(/\b\w/g, c => c.toUpperCase()); break;
    case 'sentence':
      output.value = input.value.charAt(0).toUpperCase() + input.value.slice(1).toLowerCase(); break;
    case 'camel':
      output.value = words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(''); break;
    case 'pascal':
      output.value = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(''); break;
    case 'snake':
      output.value = words.map(w => w.toLowerCase()).join('_'); break;
    case 'kebab':
      output.value = words.map(w => w.toLowerCase()).join('-'); break;
    case 'constant':
      output.value = words.map(w => w.toUpperCase()).join('_'); break;
  }
}
</script>
