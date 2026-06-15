<template>
  <div class="space-y-4">
    <TabView :tabs="['编码', '解码']">
      <template #tab-0>
        <div class="space-y-4">
          <TextInput v-model="encodeInput" label="输入文本" placeholder="请输入要编码的文本" :rows="6" show-count />
          <div class="flex justify-end">
            <button @click="encode" class="btn-primary">编码</button>
          </div>
          <TextOutput v-model="encodeOutput" label="八进制编码结果" :rows="6" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-4">
          <TextInput v-model="decodeInput" label="输入八进制" placeholder="请输入八进制字符串，如 \\141\\142\\143" :rows="6" show-count />
          <div class="flex justify-end">
            <button @click="decode" class="btn-primary">解码</button>
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

const encodeInput = ref('');
const encodeOutput = ref('');

const decodeInput = ref('');
const decodeOutput = ref('');
const error = ref('');

function encode() {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(encodeInput.value);
  encodeOutput.value = Array.from(bytes).map(b => '\\' + b.toString(8).padStart(3, '0')).join('');
}

function decode() {
  error.value = '';
  try {
    const input = decodeInput.value;
    const result = input.replace(/\\([0-3]?[0-7]{1,2})/g, (_, oct) => {
      const code = parseInt(oct, 8);
      return String.fromCharCode(code);
    });
    decodeOutput.value = result;
  } catch {
    error.value = '解码失败: 输入包含无效的八进制转义序列';
    decodeOutput.value = '';
  }
}
</script>
