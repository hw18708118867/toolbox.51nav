<template>
  <div class="space-y-4">
    <TabView :tabs="['编码', '解码']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="input" label="输入文本" placeholder="请输入要编码的文本" :rows="6" show-count />
          <div class="flex items-center gap-2">
            <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
              <input type="checkbox" v-model="urlSafe" class="rounded" />
              URL-safe 变体
            </label>
          </div>
          <div class="flex justify-end">
            <button @click="encode" class="btn-primary">
              编码
            </button>
          </div>
          <TextOutput v-model="output" label="Base64 结果" :rows="6" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decodeInput" label="输入 Base64" placeholder="请输入要解码的 Base64 字符串" :rows="6" show-count />
          <div class="flex justify-end">
            <button @click="decode" class="btn-primary">
              解码
            </button>
          </div>
          <ErrorAlert :message="error" />
          <TextOutput v-model="decodeOutput" label="解码结果" :rows="6" />
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import TabView from '../../common/TabView.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const input = ref('');
const output = ref('');
const urlSafe = ref(false);
const decodeInput = ref('');
const decodeOutput = ref('');
const error = ref('');

function encode() {
  try {
    const encoded = btoa(unescape(encodeURIComponent(input.value)));
    output.value = urlSafe.value
      ? encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      : encoded;
  } catch (e: any) {
    output.value = '';
    error.value = '编码失败: ' + e.message;
  }
}

function decode() {
  error.value = '';
  try {
    let base64 = decodeInput.value.trim();
    // 处理 URL-safe 变体
    base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
    // 补齐 padding
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    decodeOutput.value = decodeURIComponent(escape(atob(base64)));
  } catch (e: any) {
    decodeOutput.value = '';
    error.value = '解码失败: 输入不是有效的 Base64 字符串';
  }
}
</script>
