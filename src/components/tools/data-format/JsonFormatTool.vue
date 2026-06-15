<template>
  <div class="space-y-4">
    <TabView :tabs="['格式化', '压缩', '验证']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="input" label="输入 JSON" placeholder='{"key": "value"}' :rows="10" show-count />
          <div class="flex items-center gap-4">
            <label class="text-xs font-medium" style="color: var(--color-text-secondary);">缩进</label>
            <select v-model="indent" class="rounded-md border px-3 py-1.5 text-sm" >
              <option :value="2">2 空格</option>
              <option :value="4">4 空格</option>
              <option :value="'tab'">Tab</option>
            </select>
          </div>
          <div class="flex justify-end">
            <button @click="format" class="btn-primary">格式化</button>
          </div>
          <ErrorAlert :message="error" />
          <TextOutput v-model="output" label="格式化结果" :rows="10" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="compressInput" label="输入 JSON" placeholder='{"key": "value"}' :rows="10" show-count />
          <div class="flex justify-end">
            <button @click="compress" class="btn-primary">压缩</button>
          </div>
          <ErrorAlert :message="compressError" />
          <TextOutput v-model="compressOutput" label="压缩结果" :rows="5" />
        </div>
      </template>
      <template #tab-2>
        <div class="space-y-3">
          <TextInput v-model="validateInput" label="输入 JSON" placeholder='输入 JSON 进行验证' :rows="10" show-count />
          <div class="flex justify-end">
            <button @click="validate" class="btn-primary">验证</button>
          </div>
          <div v-if="validateResult !== null" class="rounded-md border p-3 text-sm" :style="validateResult ? 'background-color:#f0fdf4;border-color:#bbf7d0;color:#166534;' : 'background-color:#fef2f2;border-color:#fecaca;color:#991b1b;'">
            {{ validateResult ? '✅ JSON 格式有效' : '❌ JSON 格式无效: ' + validateError }}
          </div>
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
const indent = ref<number | string>(2);
const output = ref('');
const error = ref('');

const compressInput = ref('');
const compressOutput = ref('');
const compressError = ref('');

const validateInput = ref('');
const validateResult = ref<boolean | null>(null);
const validateError = ref('');

function format() {
  error.value = '';
  try {
    const obj = JSON.parse(input.value);
    const space = indent.value === 'tab' ? '\t' : Number(indent.value);
    output.value = JSON.stringify(obj, null, space);
  } catch (e: any) {
    error.value = 'JSON 解析失败: ' + e.message;
  }
}

function compress() {
  compressError.value = '';
  try {
    const obj = JSON.parse(compressInput.value);
    compressOutput.value = JSON.stringify(obj);
  } catch (e: any) {
    compressError.value = 'JSON 解析失败: ' + e.message;
  }
}

function validate() {
  try {
    JSON.parse(validateInput.value);
    validateResult.value = true;
    validateError.value = '';
  } catch (e: any) {
    validateResult.value = false;
    validateError.value = e.message;
  }
}
</script>
