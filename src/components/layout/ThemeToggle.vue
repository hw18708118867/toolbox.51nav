<template>
  <button
    @click="toggleTheme"
    class="p-2.5 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95"
    :style="{
      background: 'var(--glass-light)',
      color: 'var(--color-text-secondary)',
    }"
    :aria-label="isDark ? '切换到亮色模式' : '切换到暗色模式'"
    :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
  >
    <!-- Sun icon -->
    <svg v-if="isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
    <!-- Moon icon -->
    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isDark = ref(false);

onMounted(() => {
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  isDark.value = theme === 'dark';
});

function toggleTheme() {
  isDark.value = !isDark.value;
  const theme = isDark.value ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
</script>
