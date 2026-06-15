<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">生成数量</label>
        <select
          v-model="count"
          class="rounded-md border px-3 py-2 text-sm"
          
        >
          <option :value="1">1</option>
          <option :value="5">5</option>
          <option :value="10">10</option>
        </select>
      </div>
      <div class="pt-4">
        <button
          @click="generateAll"
          class="btn-primary"
        >
          生成
        </button>
      </div>
    </div>

    <div v-if="ulids.length > 0" class="space-y-2">
      <div
        v-for="(ulid, index) in ulids"
        :key="index"
        class="flex items-center justify-between rounded-md border px-4 py-2"
        style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
      >
        <span class="text-sm font-mono" style="color: var(--color-text);">{{ ulid }}</span>
        <CopyButton :text="ulid" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const count = ref(1);
const ulids = ref<string[]>([]);

const BASE32_CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeTime(time: number): string {
  let str = '';
  for (let i = 0; i < 10; i++) {
    str = BASE32_CHARS[time % 32] + str;
    time = Math.floor(time / 32);
  }
  return str;
}

function encodeRandom(length: number): string {
  let str = '';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    str += BASE32_CHARS[bytes[i] % 32];
  }
  return str;
}

function generateUlid(): string {
  const timestamp = Date.now();
  const timePart = encodeTime(timestamp);
  const randomPart = encodeRandom(16);
  return timePart + randomPart;
}

function generateAll() {
  ulids.value = [];
  for (let i = 0; i < count.value; i++) {
    ulids.value.push(generateUlid());
  }
}
</script>
