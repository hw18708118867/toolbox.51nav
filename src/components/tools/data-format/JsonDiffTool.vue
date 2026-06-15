<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <TextInput v-model="jsonA" label="JSON A" placeholder='{"a": 1, "b": 2}' :rows="10" show-count />
      <TextInput v-model="jsonB" label="JSON B" placeholder='{"a": 1, "b": 3}' :rows="10" show-count />
    </div>

    <div class="flex justify-end">
      <button
        @click="compare"
        :disabled="!jsonA.trim() || !jsonB.trim()"
        class="btn-primary"
      >
        对比
      </button>
    </div>

    <ErrorAlert :message="error" />

    <div v-if="diffResult" class="space-y-3">
      <div v-if="diffResult.added.length > 0" class="rounded-md border p-3" style="border-color: #bbf7d0; background-color: #f0fdf4;">
        <div class="text-xs font-medium mb-2" style="color: #16a34a;">新增的键 ({{ diffResult.added.length }})</div>
        <div v-for="item in diffResult.added" :key="item" class="text-sm font-mono ml-2" style="color: var(--color-text);">{{ item }}</div>
      </div>
      <div v-if="diffResult.removed.length > 0" class="rounded-md border p-3" style="border-color: #fecaca; background-color: #fef2f2;">
        <div class="text-xs font-medium mb-2" style="color: #dc2626;">已删除的键 ({{ diffResult.removed.length }})</div>
        <div v-for="item in diffResult.removed" :key="item" class="text-sm font-mono ml-2" style="color: var(--color-text);">{{ item }}</div>
      </div>
      <div v-if="diffResult.changed.length > 0" class="rounded-md border p-3" style="border-color: #fde68a; background-color: #fffbeb;">
        <div class="text-xs font-medium mb-2" style="color: #d97706;">值发生变化的键 ({{ diffResult.changed.length }})</div>
        <div v-for="item in diffResult.changed" :key="item.path" class="text-sm font-mono ml-2 mb-1" style="color: var(--color-text);">
          {{ item.path }}: {{ item.old }} => {{ item.new }}
        </div>
      </div>
      <div v-if="diffResult.added.length === 0 && diffResult.removed.length === 0 && diffResult.changed.length === 0" class="text-center text-sm py-4" style="color: var(--color-text-muted);">
        两个 JSON 完全相同
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const jsonA = ref('');
const jsonB = ref('');
const error = ref('');

interface ChangeItem {
  path: string;
  old: string;
  new: string;
}

interface DiffResult {
  added: string[];
  removed: string[];
  changed: ChangeItem[];
}

const diffResult = ref<DiffResult | null>(null);

function flattenObject(obj: Record<string, any>, prefix: string = ''): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, path));
    } else {
      result[path] = value;
    }
  }
  return result;
}

function compare() {
  error.value = '';
  diffResult.value = null;

  try {
    const objA = JSON.parse(jsonA.value);
    const objB = JSON.parse(jsonB.value);

    const flatA = flattenObject(objA);
    const flatB = flattenObject(objB);

    const keysA = new Set(Object.keys(flatA));
    const keysB = new Set(Object.keys(flatB));

    const added: string[] = [];
    const removed: string[] = [];
    const changed: ChangeItem[] = [];

    for (const key of keysB) {
      if (!keysA.has(key)) {
        added.push(key);
      }
    }

    for (const key of keysA) {
      if (!keysB.has(key)) {
        removed.push(key);
      } else {
        const valA = JSON.stringify(flatA[key]);
        const valB = JSON.stringify(flatB[key]);
        if (valA !== valB) {
          changed.push({ path: key, old: valA, new: valB });
        }
      }
    }

    diffResult.value = { added, removed, changed };
  } catch (e: any) {
    error.value = '对比失败: ' + e.message;
  }
}
</script>
