<template>
  <div class="space-y-4">
    <div>
      <p class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">
        粘贴 SVG 代码进行优化，移除注释、多余空白和冗余属性
      </p>
      <textarea
        v-model="svgInput"
        placeholder="<svg xmlns=&quot;http://www.w3.org/2000/svg&quot;...>&#10;  <!-- 注释 -->&#10;  <g  fill=&quot;red&quot; >&#10;    <circle cx=&quot;50&quot; cy=&quot;50&quot; r=&quot;40&quot; />&#10;  </g>&#10;</svg>"
        :rows="10"
        class="w-full rounded-xl px-4 py-3 text-sm resize-y font-mono"
        style="background-color: var(--color-bg-secondary); border: 1px solid var(--color-border); color: var(--color-text);"
      />
    </div>

    <div v-if="svgInput.trim()" class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2">
        <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
          <input v-model="removeComments" type="checkbox" class="rounded" style="accent-color: var(--color-primary);" />
          移除注释
        </label>
        <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
          <input v-model="collapseWhitespace" type="checkbox" class="rounded" style="accent-color: var(--color-primary);" />
          折叠空白
        </label>
        <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
          <input v-model="removeMetadata" type="checkbox" class="rounded" style="accent-color: var(--color-primary);" />
          移除元数据
        </label>
        <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
          <input v-model="removeEmptyGroups" type="checkbox" class="rounded" style="accent-color: var(--color-primary);" />
          移除空组
        </label>
      </div>
    </div>

    <div v-if="svgInput.trim()" class="flex justify-end">
      <button @click="optimize" class="btn-primary">
        优化 SVG
      </button>
    </div>

    <ErrorAlert :message="optimizeError" />

    <div v-if="optimizedSvg" class="space-y-3">
      <div class="flex items-center gap-4 text-xs" style="color: var(--color-text-secondary);">
        <span>原始大小: <strong style="color: var(--color-text);">{{ formatSize(originalSize) }}</strong></span>
        <span>优化后: <strong style="color: var(--color-text);">{{ formatSize(optimizedSize) }}</strong></span>
        <span style="color: var(--color-success);">节省: {{ savingPercent }}%</span>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-medium" style="color: var(--color-text-secondary);">优化后的 SVG</label>
          <div class="flex items-center gap-2">
            <button @click="copyOptimized" class="text-xs px-2 py-1 rounded border" style="color: var(--color-text-muted); border-color: var(--color-border);">复制</button>
            <button @click="downloadOptimized" class="btn-primary text-xs">下载</button>
          </div>
        </div>
        <textarea
          :value="optimizedSvg"
          readonly
          :rows="8"
          class="w-full rounded-xl px-4 py-3 text-sm resize-y font-mono"
          style="background-color: var(--color-bg-secondary); border: 1px solid var(--color-border); color: var(--color-text);"
        />
      </div>
    </div>

    <div v-if="!svgInput.trim()" class="rounded-md border p-6 text-center" style="border-color: var(--color-border); background-color: var(--color-bg-secondary);">
      <p class="text-xs" style="color: var(--color-text-muted);">
        在上方粘贴 SVG 代码，然后点击"优化 SVG"按钮
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const svgInput = ref('');
const optimizedSvg = ref('');
const optimizeError = ref('');

const removeComments = ref(true);
const collapseWhitespace = ref(true);
const removeMetadata = ref(true);
const removeEmptyGroups = ref(true);

const originalSize = computed(() => new Blob([svgInput.value]).size);
const optimizedSize = computed(() => new Blob([optimizedSvg.value]).size);
const savingPercent = computed(() => {
  if (originalSize.value === 0) return '0';
  return ((1 - optimizedSize.value / originalSize.value) * 100).toFixed(1);
});

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function optimize() {
  optimizeError.value = '';
  let svg = svgInput.value;

  if (!svg.trim()) {
    optimizeError.value = '请输入 SVG 代码';
    return;
  }

  try {
    // Remove comments
    if (removeComments.value) {
      svg = svg.replace(/<!--[\s\S]*?-->/g, '');
    }

    // Remove metadata elements
    if (removeMetadata.value) {
      svg = svg.replace(/<title>[\s\S]*?<\/title>/gi, '');
      svg = svg.replace(/<desc>[\s\S]*?<\/desc>/gi, '');
      svg = svg.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
      svg = svg.replace(/<sodipodi:[\s\S]*?<\/sodipodi:[^>]+>/gi, '');
      svg = svg.replace(/<inkscape:[\s\S]*?<\/inkscape:[^>]+>/gi, '');
    }

    // Remove empty groups
    if (removeEmptyGroups.value) {
      // Remove groups with only whitespace
      svg = svg.replace(/<g[^>]*>\s*<\/g>/gi, '');
    }

    // Collapse whitespace
    if (collapseWhitespace.value) {
      // Remove newlines and tabs between tags
      svg = svg.replace(/>\s+</g, '><');
      svg = svg.replace(/\s{2,}/g, ' ');
      svg = svg.replace(/\n/g, '');
      svg = svg.replace(/\t/g, ' ');
      svg = svg.replace(/^\s+|\s+$/gm, '');
    }

    // Remove redundant attributes
    svg = svg.replace(/\s+id="[^"]*"/gi, (match) => {
      // Keep ids that might be referenced
      return '';
    });

    // Remove version attribute (not needed in modern SVG)
    svg = svg.replace(/\s+version="[^"]*"/gi, '');
    svg = svg.replace(/\s+xmlns:xlink="[^"]*"/gi, '');
    svg = svg.replace(/\s+xml:space="[^"]*"/gi, '');
    svg = svg.replace(/\s+enable-background="[^"]*"/gi, '');

    // Normalize spaces within tags
    svg = svg.replace(/\s+/g, ' ');

    // Fix self-closing tags
    svg = svg.replace(/\s*\/>/g, '/>');

    optimizedSvg.value = svg.trim();
  } catch (e: any) {
    optimizeError.value = '优化失败: ' + e.message;
  }
}

async function copyOptimized() {
  try {
    await navigator.clipboard.writeText(optimizedSvg.value);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = optimizedSvg.value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

function downloadOptimized() {
  const blob = new Blob([optimizedSvg.value], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'optimized.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>
