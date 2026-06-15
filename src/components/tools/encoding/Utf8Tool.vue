<template>
  <div class="space-y-4">
    <TextInput v-model="input" label="输入文本" placeholder="请输入文本" :rows="6" show-count />

    <div v-if="input && bytes.length > 0" class="space-y-3">
      <div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
        <h3 class="text-sm font-medium mb-3" style="color: var(--color-text-secondary);">UTF-8 字节序列</h3>
        <div class="space-y-2">
          <div class="flex items-start gap-2">
            <span class="text-xs shrink-0 w-16" style="color: var(--color-text-muted);">十六进制:</span>
            <code class="text-sm font-mono break-all" style="color: var(--color-primary);">{{ hexStr }}</code>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-xs shrink-0 w-16" style="color: var(--color-text-muted);">十进制:</span>
            <code class="text-sm font-mono break-all" style="color: var(--color-text);">{{ decStr }}</code>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-xs shrink-0 w-16" style="color: var(--color-text-muted);">字节数:</span>
            <span class="text-sm" style="color: var(--color-text);">{{ bytes.length }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TextInput from '../../common/TextInput.vue';

const input = ref('');

const bytes = computed<number[]>(() => {
  if (!input.value) return [];
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(input.value));
});

const hexStr = computed(() => bytes.value.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' '));

const decStr = computed(() => bytes.value.map(b => b.toString(10)).join(' '));
</script>
