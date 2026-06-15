<template>
  <div class="space-y-4">
    <div class="space-y-3">
      <div class="flex gap-2">
        <select
          v-model="method"
          class="rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        >
          <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
        </select>
        <input
          v-model="url"
          type="text"
          placeholder="请输入 URL，例如: https://api.example.com/users"
          class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        />
      </div>

      <!-- Headers -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium" style="color: var(--color-text-secondary);">请求头</span>
          <button @click="addHeader" class="text-xs font-medium transition-colors" style="color: var(--color-primary);">
            + 添加请求头
          </button>
        </div>
        <div v-for="(header, index) in headers" :key="index" class="flex gap-2 mb-2">
          <input
            v-model="header.key"
            type="text"
            placeholder="Key"
            class="flex-1 rounded-md border px-3 py-1.5 text-sm focus:outline-none "
            
          />
          <input
            v-model="header.value"
            type="text"
            placeholder="Value"
            class="flex-1 rounded-md border px-3 py-1.5 text-sm focus:outline-none "
            
          />
          <button @click="removeHeader(index)" class="px-2 py-1.5 rounded-md border text-sm transition-colors" style="border-color: var(--color-border); color: var(--color-text-muted);">
            &times;
          </button>
        </div>
      </div>

      <!-- Body -->
      <div v-if="hasBody">
        <div class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">请求体</div>
        <textarea
          v-model="body"
          placeholder='请输入请求体内容，例如: {"key": "value"}'
          :rows="4"
          class="w-full rounded-md border px-3 py-2 text-sm resize-y focus:outline-none "
          
        />
      </div>

      <!-- Auth -->
      <div>
        <div class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">认证</div>
        <input
          v-model="bearerToken"
          type="text"
          placeholder="Bearer Token（可选）"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "
          
        />
      </div>
    </div>

    <!-- Generated cURL command -->
    <div>
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs font-medium" style="color: var(--color-text-secondary);">cURL 命令</span>
        <CopyButton :text="curlCommand" />
      </div>
      <textarea
        :value="curlCommand"
        readonly
        :rows="8"
        class="w-full rounded-md border px-3 py-2 text-sm resize-y font-mono"
        style="background-color: var(--color-bg-tertiary); border-color: var(--color-border); color: var(--color-text);"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CopyButton from '../../common/CopyButton.vue';

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const method = ref('GET');
const url = ref('');
const headers = ref<{ key: string; value: string }[]>([]);
const body = ref('');
const bearerToken = ref('');

const hasBody = computed(() => ['POST', 'PUT', 'PATCH'].includes(method.value));

const curlCommand = computed(() => {
  const parts: string[] = ['curl'];

  if (method.value !== 'GET') {
    parts.push(`-X ${method.value}`);
  }

  // Bearer token
  if (bearerToken.value.trim()) {
    parts.push(`-H "Authorization: Bearer ${bearerToken.value.trim()}"`);
  }

  // Headers
  for (const h of headers.value) {
    if (h.key.trim() && h.value.trim()) {
      parts.push(`-H "${h.key.trim()}: ${h.value.trim()}"`);
    }
  }

  // Body
  if (hasBody.value && body.value.trim()) {
    parts.push(`-d '${body.value.trim()}'`);
  }

  // URL
  if (url.value.trim()) {
    parts.push(`'${url.value.trim()}'`);
  }

  return parts.join(' \\\n  ');
});

function addHeader() {
  headers.value.push({ key: '', value: '' });
}

function removeHeader(index: number) {
  headers.value.splice(index, 1);
}
</script>
