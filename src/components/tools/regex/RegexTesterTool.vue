<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <label class="text-xs font-medium" style="color: var(--color-text-secondary);">正则表达式</label>
      <div class="flex gap-2">
        <div class="flex-1 flex rounded-md border overflow-hidden" style="border-color: var(--color-border);">
          <span class="px-2 py-2 text-sm" style="background-color: var(--color-bg-tertiary); color: var(--color-text-muted);">/</span>
          <input v-model="pattern" type="text" placeholder="输入正则表达式" class="flex-1 px-2 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg); color: var(--color-text);" />
          <span class="px-2 py-2 text-sm" style="background-color: var(--color-bg-tertiary); color: var(--color-text-muted);">/</span>
          <input v-model="flags" type="text" placeholder="gi" class="w-12 px-2 py-2 text-sm font-mono focus:outline-none" style="background-color: var(--color-bg); color: var(--color-text);" />
        </div>
      </div>
    </div>
    <TextInput v-model="testText" label="测试文本" placeholder="输入要匹配的文本" :rows="8" />

    <div v-if="error" class="rounded-md border px-3 py-2 text-sm" style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b;">
      {{ error }}
    </div>

    <div v-if="matches.length > 0" class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
      <h3 class="text-sm font-medium mb-2" style="color: var(--color-text);">
        匹配结果 ({{ matches.length }} 个)
      </h3>
      <div v-for="(match, i) in matches" :key="i" class="mb-2 last:mb-0">
        <div class="text-xs" style="color: var(--color-text-secondary);">
          匹配 {{ i + 1 }}: <code class="px-1 py-0.5 rounded text-xs" style="background-color: var(--color-primary-light); color: var(--color-primary);">{{ match[0] }}</code>
          <span style="color: var(--color-text-muted);"> (索引 {{ match.index }})</span>
        </div>
        <div v-if="match.length > 1" class="ml-4 mt-1">
          <span v-for="(group, gi) in match.slice(1)" :key="gi" class="text-xs mr-3" style="color: var(--color-text-muted);">
            ${{ gi + 1 }}: <code style="color: var(--color-primary);">{{ group ?? '(undefined)' }}</code>
          </span>
        </div>
      </div>
    </div>

    <div v-if="pattern && !error && matches.length === 0 && testText" class="rounded-md border p-4 text-sm" style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text-muted);">
      无匹配结果
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import TextInput from '../../common/TextInput.vue';

const pattern = ref('');
const flags = ref('g');
const testText = ref('');
const error = ref('');

const matches = computed(() => {
  if (!pattern.value || !testText.value) return [];
  try {
    const regex = new RegExp(pattern.value, flags.value);
    const results: RegExpMatchArray[] = [];
    let match: RegExpMatchArray | null;
    const text = testText.value;

    if (flags.value.includes('g')) {
      while ((match = regex.exec(text)) !== null) {
        results.push(match);
        if (match[0] === '') regex.lastIndex++;
        if (results.length > 500) break;
      }
    } else {
      match = regex.exec(text);
      if (match) results.push(match);
    }

    error.value = '';
    return results;
  } catch (e: any) {
    error.value = e.message;
    return [];
  }
});
</script>
