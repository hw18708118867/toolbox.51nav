<template>
  <div class="space-y-4">
    <div class="space-y-3">
      <div class="flex gap-4">
        <div class="flex-1">
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">版本</label>
          <select
            v-model="version"
            class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
            
          >
            <option value="v4">v4 (随机)</option>
            <option value="v1">v1 (时间戳)</option>
          </select>
        </div>
        <div class="flex-1">
          <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">数量</label>
          <select
            v-model="count"
            class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
            
          >
            <option v-for="c in counts" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </div>

      <div class="flex gap-2 justify-end">
        <button
          @click="generateAll"
          class="btn-primary"
        >
          生成
        </button>
        <button
          v-if="uuids.length > 0"
          @click="copyAll"
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors border"
          style="background-color: var(--color-bg-secondary); color: var(--color-text); border-color: var(--color-border);"
        >
          全部复制
        </button>
      </div>
    </div>

    <div v-if="uuids.length > 0" class="space-y-2">
      <div
        v-for="(uuid, index) in uuids"
        :key="index"
        class="flex items-center justify-between rounded-md border px-4 py-2"
        style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
      >
        <span class="text-sm font-mono" style="color: var(--color-text);">{{ uuid }}</span>
        <CopyButton :text="uuid" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const counts = [1, 5, 10, 50];
const version = ref('v4');
const count = ref(1);
const uuids = ref<string[]>([]);

function generateV4(): string {
  return crypto.randomUUID();
}

function generateV1(): string {
  const now = Date.now();
  const hexTime = now.toString(16).padStart(12, '0');
  const randomPart = () => Math.random().toString(16).substring(2, 6);
  return `${hexTime.substring(0, 8)}-${hexTime.substring(8, 12)}-1${randomPart()}-${randomPart()}-${randomPart()}${randomPart()}`.substring(0, 36);
}

function generateAll() {
  uuids.value = [];
  const generator = version.value === 'v4' ? generateV4 : generateV1;
  for (let i = 0; i < count.value; i++) {
    uuids.value.push(generator());
  }
}

async function copyAll() {
  const text = uuids.value.join('\n');
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
</script>
