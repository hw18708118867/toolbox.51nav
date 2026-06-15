<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">长度: {{ length }}</label>
        <input
          v-model.number="length"
          type="range"
          :min="8"
          :max="64"
          class="w-40"
        />
      </div>
      <div class="pt-4">
        <button
          @click="generate"
          class="btn-primary"
        >
          生成
        </button>
      </div>
    </div>

    <div v-if="nanoid" class="rounded-md border p-4" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <div class="flex items-center justify-between">
        <span class="text-sm font-mono break-all" style="color: var(--color-text);">{{ nanoid }}</span>
        <CopyButton :text="nanoid" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const length = ref(21);
const nanoid = ref('');

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function generateNanoId(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => CHARS[b % CHARS.length]).join('');
}

function generate() {
  nanoid.value = generateNanoId(length.value);
}

onMounted(() => {
  generate();
});
</script>
