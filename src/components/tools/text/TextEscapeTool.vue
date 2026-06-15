<template>
  <div class="space-y-4">
    <TabView :tabs="['转义', '反转义']">
      <template #tab-0>
        <div class="space-y-4">
          <TextInput v-model="escapeInput" label="输入文本" placeholder="请输入要转义的文本" :rows="10" show-count />
          <div class="flex items-center gap-3">
          </div>
          <TextOutput v-model="escapeOutput" label="转义结果" :rows="10" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-4">
          <TextInput v-model="unescapeInput" label="输入文本" placeholder="请输入要反转义的文本（如 \n \t 等）" :rows="10" show-count />
          <div class="flex items-center gap-3">
          </div>
          <TextOutput v-model="unescapeOutput" label="反转义结果" :rows="10" />
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

const escapeInput = ref('');
const escapeOutput = ref('');

const unescapeInput = ref('');
const unescapeOutput = ref('');

function doEscape() {
  const map: Record<string, string> = {
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\\': '\\\\',
    "'": "\\'",
    '"': '\\"',
  };
  escapeOutput.value = [...escapeInput.value].map(ch => map[ch] || ch).join('');
}

function doUnescape() {
  let result = unescapeInput.value;
  result = result.replace(/\\n/g, '\n');
  result = result.replace(/\\r/g, '\r');
  result = result.replace(/\\t/g, '\t');
  result = result.replace(/\\\\/g, '\\');
  result = result.replace(/\\'/g, "'");
  result = result.replace(/\\"/g, '"');
  result = result.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  unescapeOutput.value = result;
}
</script>
