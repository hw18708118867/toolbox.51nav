<template>
  <div class="space-y-4">
    <TabView :tabs="['加密', '解密']">
      <template #tab-0>
        <div class="space-y-3">
          <TextInput v-model="encryptInput" label="输入明文" placeholder="请输入要加密的文本" :rows="4" show-count />
          <div>
            <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">密钥</label>
            <input v-model="key" type="text" placeholder="请输入密钥" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "  />
          </div>
          <div class="flex justify-end">
            <button @click="encrypt" class="btn-primary">加密</button>
          </div>
          <ErrorAlert :message="error" />
          <TextOutput v-model="encryptOutput" label="加密结果" :rows="4" />
        </div>
      </template>
      <template #tab-1>
        <div class="space-y-3">
          <TextInput v-model="decryptInput" label="输入密文" placeholder="请输入要解密的密文" :rows="4" show-count />
          <div>
            <label class="text-xs font-medium mb-1 block" style="color: var(--color-text-secondary);">密钥</label>
            <input v-model="decryptKey" type="text" placeholder="请输入密钥" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none "  />
          </div>
          <div class="flex justify-end">
            <button @click="decrypt" class="btn-primary">解密</button>
          </div>
          <ErrorAlert :message="decryptError" />
          <TextOutput v-model="decryptOutput" label="解密结果" :rows="4" />
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CryptoJS from 'crypto-js';
import TextInput from '../../common/TextInput.vue';
import TextOutput from '../../common/TextOutput.vue';
import TabView from '../../common/TabView.vue';
import ErrorAlert from '../../common/ErrorAlert.vue';

const encryptInput = ref('');
const key = ref('');
const encryptOutput = ref('');
const error = ref('');

const decryptInput = ref('');
const decryptKey = ref('');
const decryptOutput = ref('');
const decryptError = ref('');

function encrypt() {
  error.value = '';
  try {
    const encrypted = CryptoJS.RC4.encrypt(encryptInput.value, key.value);
    encryptOutput.value = encrypted.toString();
  } catch (e: any) {
    error.value = '加密失败: ' + e.message;
  }
}

function decrypt() {
  decryptError.value = '';
  try {
    const decrypted = CryptoJS.RC4.decrypt(decryptInput.value, decryptKey.value);
    decryptOutput.value = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptOutput.value) {
      decryptError.value = '解密失败: 可能密钥不正确';
    }
  } catch (e: any) {
    decryptError.value = '解密失败: ' + e.message;
  }
}
</script>
