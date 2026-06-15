<template>
  <div
    v-if="message"
    class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
    style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b;"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
    <span>{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string;
}>();
</script>
