<template>
  <div class="space-y-4">
    <!-- 动态注入 keyframes -->
    <component :is="'style'">{{ currentKeyframes }}</component>

    <div class="grid grid-cols-3 gap-4">
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">动画名称</label>
        <select
          v-model="animationName"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        >
          <option value="bounce">bounce</option>
          <option value="fadeIn">fadeIn</option>
          <option value="slideIn">slideIn</option>
          <option value="spin">spin</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">持续时间</label>
        <input
          v-model="duration"
          type="text"
          class="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none "
          
        />
      </div>
      <div>
        <label class="text-xs font-medium block mb-1" style="color: var(--color-text-secondary);">timing-function</label>
        <select
          v-model="timingFunction"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        >
          <option value="ease">ease</option>
          <option value="ease-in">ease-in</option>
          <option value="ease-out">ease-out</option>
          <option value="ease-in-out">ease-in-out</option>
          <option value="linear">linear</option>
        </select>
      </div>
    </div>

    <div class="flex justify-start">
      <button
        @click="toggleAnimation"
        class="btn-primary"
      >
        {{ playing ? '暂停' : '播放' }}
      </button>
    </div>

    <div>
      <label class="text-xs font-medium block mb-2" style="color: var(--color-text-secondary);">预览</label>
      <div
        class="rounded-lg border p-8 flex items-center justify-center min-h-[150px]"
        style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
      >
        <div
          :class="['w-16 h-16 rounded-lg']"
          :style="previewStyle"
          style="background-color: #FF6B6B;"
        ></div>
      </div>
    </div>

    <div>
      <div class="flex items-center justify-between mb-1.5">
        <label class="text-xs font-medium" style="color: var(--color-text-secondary);">CSS 代码</label>
        <CopyButton :text="cssCode" />
      </div>
      <pre
        class="w-full rounded-md border px-3 py-2 text-sm font-mono overflow-x-auto"
        style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text);"
      >{{ cssCode }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const animationName = ref('bounce');
const duration = ref('1s');
const timingFunction = ref('ease');
const playing = ref(false);

const keyframesMap: Record<string, string> = {
  bounce: `@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-30px); }
}`,
  fadeIn: `@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}`,
  slideIn: `@keyframes slideIn {
  from { transform: translateX(-100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}`,
  spin: `@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`,
};

const currentKeyframes = computed(() => {
  return keyframesMap[animationName.value] || '';
});

const previewStyle = computed(() => {
  if (!playing.value) return {};
  return {
    animationName: animationName.value,
    animationDuration: duration.value,
    animationTimingFunction: timingFunction.value,
    animationIterationCount: 'infinite',
  };
});

const cssCode = computed(() => {
  const kf = keyframesMap[animationName.value] || '';
  const anim = [
    `.element {`,
    `  animation-name: ${animationName.value};`,
    `  animation-duration: ${duration.value};`,
    `  animation-timing-function: ${timingFunction.value};`,
    `  animation-iteration-count: infinite;`,
    `}`,
  ].join('\n');
  return kf + '\n\n' + anim;
});

function toggleAnimation() {
  playing.value = !playing.value;
}
</script>
