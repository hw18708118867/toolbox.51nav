<template>
  <button
    @click="copyToClipboard"
    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300"
    :style="copied
      ? 'background: var(--color-success); color: white; border-color: var(--color-success);'
      : 'background: var(--glass-light); color: var(--color-text-secondary); border: 1px solid var(--glass-border);'"
  >
    <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
    <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
    {{ copied ? '已复制' : '复制' }}
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  text: string;
}>();

const copied = ref(false);

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(props.text);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // fallback
    const textarea = document.createElement('textarea');
    textarea.value = props.text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
}
</script>
