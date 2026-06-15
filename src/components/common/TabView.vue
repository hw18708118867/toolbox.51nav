<template>
  <div>
    <div class="flex gap-1 p-1 rounded-2xl" style="background: var(--glass-light);">
      <button
        v-for="(tab, index) in tabs"
        :key="index"
        @click="activeIndex = index"
        class="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300"
        :style="activeIndex === index
          ? 'background: var(--glass-strong); color: var(--color-text); box-shadow: var(--shadow-sm);'
          : 'background: transparent; color: var(--color-text-muted);'"
      >
        {{ tab }}
      </button>
    </div>
    <div class="mt-4">
      <slot :name="`tab-${activeIndex}`" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  tabs: string[];
}>();

const activeIndex = ref(0);
</script>
