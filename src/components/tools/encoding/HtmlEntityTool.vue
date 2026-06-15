<template>
  <div class="space-y-4">
    <TabView :tabs="['编码', '解码']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="input" label="输入文本" placeholder="请输入要编码的文本" :rows="6" show-count />
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
              <input type="radio" v-model="mode" value="named" name="entity-mode" />
              命名实体
            </label>
            <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
              <input type="radio" v-model="mode" value="decimal" name="entity-mode" />
              十进制实体
            </label>
            <label class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-secondary);">
              <input type="radio" v-model="mode" value="hex" name="entity-mode" />
              十六进制实体
            </label>
          </div>
          <div class="flex justify-end">
            <button @click="encode" class="btn-primary">
              编码
            </button>
          </div>
          <TextOutput v-model="output" label="HTML 实体编码结果" :rows="6" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decodeInput" label="输入 HTML 实体" placeholder="请输入要解码的 HTML 实体" :rows="6" show-count />
          <div class="flex justify-end">
            <button @click="decode" class="btn-primary">
              解码
            </button>
          </div>
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

const namedEntities: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  ' ': '&nbsp;', '©': '&copy;', '®': '&reg;', '™': '&trade;',
  '¥': '&yen;', '€': '&euro;', '£': '&pound;', '¢': '&cent;',
  '§': '&sect;', '±': '&plusmn;', '×': '&times;', '÷': '&divide;',
  '°': '&deg;', '¶': '&para;', '·': '&middot;', '…': '&hellip;',
  '←': '&larr;', '→': '&rarr;', '↑': '&uarr;', '↓': '&darr;',
};

const input = ref('');
const output = ref('');
const mode = ref<'named' | 'decimal' | 'hex'>('named');
const decodeInput = ref('');
const decodeOutput = ref('');

function encode() {
  output.value = input.value.replace(/[\s\S]/g, (char) => {
    if (mode.value === 'named' && namedEntities[char]) {
      return namedEntities[char];
    }
    const code = char.codePointAt(0)!;
    if (code > 127 || (mode.value === 'named' && namedEntities[char] === undefined && char !== char)) {
      if (mode.value === 'hex') {
        return `&#x${code.toString(16)};`;
      }
      return `&#${code};`;
    }
    if (mode.value === 'named') {
      return char;
    }
    if (mode.value === 'hex') {
      return `&#x${code.toString(16)};`;
    }
    return `&#${code};`;
  });
}

function decode() {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = decodeInput.value;
  decodeOutput.value = textarea.value;
}
</script>
