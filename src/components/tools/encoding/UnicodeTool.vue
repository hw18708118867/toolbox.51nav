<template>
  <div class="space-y-4">
    <TabView :tabs="['编码', '解码']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="input" label="输入文本" placeholder="请输入要编码的文本（支持中文）" :rows="6" show-count />
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
              <input type="radio" v-model="format" value="escape" name="unicode-format" />
              \uXXXX
            </label>
            <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
              <input type="radio" v-model="format" value="html" name="unicode-format" />
              &#xXXXX;
            </label>
            <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
              <input type="checkbox" v-model="encodeAscii" />
              编码 ASCII
            </label>
          </div>
          <div class="flex justify-end">
            <button @click="encode" class="btn-primary">
              编码
            </button>
          </div>
          <TextOutput v-model="output" label="Unicode 编码结果" :rows="6" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decodeInput" label="输入 Unicode 编码" placeholder="请输入 Unicode 编码（如 \\u4e2d\\u6587）" :rows="6" show-count />
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
const format = ref<'escape' | 'html'>('escape');
const encodeAscii = ref(false);
const decodeInput = ref('');
const decodeOutput = ref('');
const error = ref('');

function encode() {
  output.value = Array.from(input.value).map((char) => {
    const code = char.codePointAt(0)!;
    if (!encodeAscii.value && code < 128) return char;
    if (format.value === 'escape') {
      return code > 0xFFFF
        ? `\\u{${code.toString(16)}}`
        : `\\u${code.toString(16).padStart(4, '0')}`;
    }
    return `&#x${code.toString(16)};`;
  }).join('');
}

function decode() {
  error.value = '';
  try {
    let result = decodeInput.value;
    // 处理 \uXXXX 格式
    result = result.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    );
    result = result.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
    // 处理 &#xXXXX; 格式
    result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    );
    // 处理 &#DDDD; 格式
    result = result.replace(/&#(\d+);/g, (_, dec) =>
      String.fromCodePoint(parseInt(dec, 10))
    );
    decodeOutput.value = result;
  } catch {
    error.value = '解码失败: 输入不是有效的 Unicode 编码';
    decodeOutput.value = '';
  }
}
</script>
