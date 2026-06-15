<template>
  <div class="space-y-4">
    <TabView :tabs="['编码', '解码']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="input" label="输入文本" placeholder="请输入要编码的文本" :rows="6" show-count />
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
              <input type="radio" v-model="separator" value="space" name="bin-sep" />
              空格分隔
            </label>
            <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
              <input type="radio" v-model="separator" value="none" name="bin-sep" />
              无分隔
            </label>
            <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
              <input type="checkbox" v-model="prefix0b" />
              0b 前缀
            </label>
          </div>
          <div class="flex justify-end">
            <button @click="encode" class="btn-primary">
              编码
            </button>
          </div>
          <TextOutput v-model="output" label="二进制编码结果" :rows="6" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decodeInput" label="输入二进制" placeholder="请输入二进制字符串" :rows="6" show-count />
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
const separator = ref<'space' | 'none'>('space');
const prefix0b = ref(false);
const decodeInput = ref('');
const decodeOutput = ref('');
const error = ref('');

function encode() {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input.value);
  const binArr = Array.from(bytes).map((b) => {
    const bin = b.toString(2).padStart(8, '0');
    return prefix0b.value ? '0b' + bin : bin;
  });
  output.value = separator.value === 'space' ? binArr.join(' ') : binArr.join('');
}

function decode() {
  error.value = '';
  try {
    const binStr = decodeInput.value.replace(/0b/gi, '').replace(/[\s]/g, '');
    if (!/^[01]*$/.test(binStr) || binStr.length % 8 !== 0) {
      error.value = '解码失败: 输入不是有效的二进制字符串（需为 8 的倍数位）';
      decodeOutput.value = '';
      return;
    }
    const bytes = new Uint8Array(binStr.length / 8);
    for (let i = 0; i < binStr.length; i += 8) {
      bytes[i / 8] = parseInt(binStr.substring(i, i + 8), 2);
    }
    decodeOutput.value = new TextDecoder().decode(bytes);
  } catch {
    error.value = '解码失败';
    decodeOutput.value = '';
  }
}
</script>
