<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">数值 A</label>
        <input
          v-model.number="valueA"
          type="number"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">数值 B</label>
        <input
          v-model.number="valueB"
          type="number"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        />
      </div>
    </div>

    <div v-if="valid" class="grid grid-cols-2 gap-3">
      <div class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-medium" style="color: var(--color-text-secondary);">AND (位与)</span>
          <CopyButton :text="(valueA & valueB).toString()" />
        </div>
        <code class="text-sm font-mono" style="color: var(--color-text);">
          {{ valueA }} & {{ valueB }} = {{ valueA & valueB }}
        </code>
      </div>
      <div class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-medium" style="color: var(--color-text-secondary);">OR (位或)</span>
          <CopyButton :text="(valueA | valueB).toString()" />
        </div>
        <code class="text-sm font-mono" style="color: var(--color-text);">
          {{ valueA }} | {{ valueB }} = {{ valueA | valueB }}
        </code>
      </div>
      <div class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-medium" style="color: var(--color-text-secondary);">XOR (位异或)</span>
          <CopyButton :text="(valueA ^ valueB).toString()" />
        </div>
        <code class="text-sm font-mono" style="color: var(--color-text);">
          {{ valueA }} ^ {{ valueB }} = {{ valueA ^ valueB }}
        </code>
      </div>
      <div class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-medium" style="color: var(--color-text-secondary);">NOT A (位非)</span>
          <CopyButton :text="(~valueA).toString()" />
        </div>
        <code class="text-sm font-mono" style="color: var(--color-text);">
          ~{{ valueA }} = {{ ~valueA }}
        </code>
      </div>
      <div class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-medium" style="color: var(--color-text-secondary);">左移 (A &lt;&lt; B)</span>
          <CopyButton :text="(valueA << valueB).toString()" />
        </div>
        <code class="text-sm font-mono" style="color: var(--color-text);">
          {{ valueA }} &lt;&lt; {{ valueB }} = {{ valueA << valueB }}
        </code>
      </div>
      <div class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-medium" style="color: var(--color-text-secondary);">右移 (A &gt;&gt; B)</span>
          <CopyButton :text="(valueA >> valueB).toString()" />
        </div>
        <code class="text-sm font-mono" style="color: var(--color-text);">
          {{ valueA }} &gt;&gt; {{ valueB }} = {{ valueA >> valueB }}
        </code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const valueA = ref(0);
const valueB = ref(0);

const valid = computed(() => !isNaN(valueA.value) && !isNaN(valueB.value));
</script>
