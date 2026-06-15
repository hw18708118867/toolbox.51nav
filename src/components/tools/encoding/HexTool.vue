<template>
  <div class="space-y-4">
    <TabView :tabs="['编码', '解码']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="input" label="输入文本" placeholder="请输入要编码的文本" :rows="6" show-count />
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
              <input type="radio" v-model="separator" value="space" name="hex-sep" />
              空格分隔
            </label>
            <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
              <input type="radio" v-model="separator" value="none" name="hex-sep" />
              无分隔
            </label>
            <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
              <input type="radio" v-model="separator" value="prefix" name="hex-sep" />
              0x 前缀
            </label>
          </div>
          <div class="flex justify-end">
            <button @click="encode" class="btn-primary">
              编码
            </button>
          </div>
          <TextOutput v-model="output" label="Hex 编码结果" :rows="6" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decodeInput" label="输入 Hex 字符串" placeholder="请输入十六进制字符串" :rows="6" show-count />
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
const separator = ref<'space' | 'none' | 'prefix'>('space');
const decodeInput = ref('');
const decodeOutput = ref('');
const error = ref('');

function encode() {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input.value);
  const hexArr = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0'));

  if (separator.value === 'space') {
    output.value = hexArr.join(' ');
  } else if (separator.value === 'prefix') {
    output.value = hexArr.map((h) => '0x' + h).join(' ');
  } else {
    output.value = hexArr.join('');
  }
}

function decode() {
  error.value = '';
  try {
    const hexStr = decodeInput.value.replace(/0x/gi, '').replace(/[\s,;:]/g, '');
    if (!/^[0-9a-fA-F]*$/.test(hexStr) || hexStr.length % 2 !== 0) {
      error.value = '解码失败: 输入不是有效的十六进制字符串';
      decodeOutput.value = '';
      return;
    }
    const bytes = new Uint8Array(hexStr.length / 2);
    for (let i = 0; i < hexStr.length; i += 2) {
      bytes[i / 2] = parseInt(hexStr.substring(i, i + 2), 16);
    }
    const decoder = new TextDecoder();
    decodeOutput.value = decoder.decode(bytes);
  } catch {
    error.value = '解码失败: 无法解码为有效文本';
    decodeOutput.value = '';
  }
}
</script>
