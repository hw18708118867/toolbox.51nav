<template>
  <div class="space-y-4">
    <TabView :tabs="['编码', '解码']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="input" label="输入文本" placeholder="请输入要编码的文本" :rows="6" show-count />
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
              <input type="radio" v-model="mode" value="component" name="url-mode" />
              encodeURIComponent
            </label>
            <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
              <input type="radio" v-model="mode" value="uri" name="url-mode" />
              encodeURI
            </label>
          </div>
          <div class="flex justify-end">
            <button @click="encode" class="btn-primary">
              编码
            </button>
          </div>
          <TextOutput v-model="output" label="URL 编码结果" :rows="6" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decodeInput" label="输入 URL 编码文本" placeholder="请输入要解码的 URL 编码字符串" :rows="6" show-count />
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
const mode = ref<'component' | 'uri'>('component');
const decodeInput = ref('');
const decodeOutput = ref('');
const error = ref('');

function encode() {
  try {
    output.value = mode.value === 'component'
      ? encodeURIComponent(input.value)
      : encodeURI(input.value);
  } catch (e: any) {
    output.value = '';
  }
}

function decode() {
  error.value = '';
  try {
    decodeOutput.value = decodeURIComponent(decodeInput.value);
  } catch {
    error.value = '解码失败: 输入不是有效的 URL 编码字符串';
    decodeOutput.value = '';
  }
}
</script>
